import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';

// Path to save reminders
const remindersFilePath = `${FileSystem.documentDirectory}vaccinereminders.json`;

const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/');
    return new Date(`${year}-${month}-${day}`);
  };

  const parseTime = (timeString) => {
    const [time, modifier] = timeString.split(' ');
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    if (modifier === 'PM' && hours !== 12) {
        hours += 12;
    } else if (modifier === 'AM' && hours === 12) {
        hours = 0;
    }
    return { hours, minutes }; // Create date object with parsed time
};

// Function to schedule vaccine reminders
const vaccinereminder = async (name,vaccineList) => {
  // Request notification permissions
  console.log('data came',name,vaccineList)
  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      alert('Permission for notifications not granted');
      return;
    }
  };

  await requestPermissions();

  // Load existing reminders
  let existingReminders = [];
  try {
    const remindersData = await FileSystem.readAsStringAsync(remindersFilePath);
    existingReminders = JSON.parse(remindersData);
  } catch (error) {
    console.log('No existing reminders found, creating new file.');
  }

  // Schedule notifications for each vaccine
  const newReminders = [];
  for (const vaccine of vaccineList) {
    const dueDate = parseDate(vaccine.dueDate);
      const reminderDate = new Date(dueDate);
      reminderDate.setDate(dueDate.getDate() - 4);
      const { hours, minutes } = parseTime(vaccine.Time);

    const reminder = {
      babyname: name,
      id: vaccine.id,
      name: vaccine.name,
      time: vaccine.Time,
      dueDate: dueDate.toISOString(),
      reminderDate: reminderDate.toISOString(),
    };

    newReminders.push(reminder);

    reminderDate.setHours(hours);
    reminderDate.setMinutes(minutes);
    reminderDate.setSeconds(0);

    
    console.log('hours', hours, 'minutes', minutes, 'reminderDate', reminder.reminderDate);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Vaccine Reminder',
        body: `Reminder: ${vaccine.name} is due on ${dueDate.toDateString()}`,
      },
      trigger: {
        date: reminderDate,
      },
    });
  }

  // Save reminders to local file storage
  const allReminders = [...existingReminders, ...newReminders];
  await FileSystem.writeAsStringAsync(remindersFilePath, JSON.stringify(allReminders));
  console.log('reminder list',allReminders)
};

export default vaccinereminder;