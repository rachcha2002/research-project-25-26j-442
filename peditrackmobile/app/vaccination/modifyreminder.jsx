import * as Notifications from 'expo-notifications';
import * as FileSystem from 'expo-file-system';

// Path to save reminders
const remindersFilePath = `${FileSystem.documentDirectory}vaccinereminders.json`;
const parseTime = (timeString) => {
    const cleanedTimeString = timeString.trim().replace(/\u00A0/g, ' '); // Replace non-breaking space with regular space

    console.log('Time comes:', cleanedTimeString);
    
    const parts = cleanedTimeString.split(/\s+/); // Split by whitespace
    if (parts.length < 2) {
        throw new Error('Invalid time format: Time or modifier is missing');
    }

    const time = parts.slice(0, parts.length - 1).join(' '); // Time part without AM/PM
    const modifier = parts[parts.length - 1]; // AM/PM part

    let [hours, minutes] = time.split(':').map(Number); // Convert hours and minutes to numbers
    if (isNaN(hours) || isNaN(minutes)) {
        throw new Error('Invalid time format');
    }

    // Convert to 24-hour format based on AM/PM
    if (modifier === 'PM' && hours < 12) {
        hours += 12; // Convert PM to 24-hour format
    } else if (modifier === 'AM' && hours === 12) {
        hours = 0; // Convert 12 AM to 0 hours
    }

    return { hours, minutes };
};

// Function to extract date from a custom date string format (dd/MM/yyyy)
const parseDate = (dateString) => {
    const [day, month, year] = dateString.split('/').map(Number); // Split and convert to numbers
    // Create a new Date object (months are 0-indexed in JavaScript)
    const date = new Date(year, month - 1, day);
    return date; // Return the Date object
};

// Function to schedule vaccine reminders
const modifyreminder = async (name, id, vaccinename, vaccinettime, vaccinedate) => {
    // Request notification permissions
    console.log('data came', name, vaccinename, id, vaccinedate, vaccinettime);
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

    existingReminders = existingReminders.filter(reminder => 
        !(reminder.babyname === name && reminder.id === id)
    );
     //existingReminders = [];

    console.log('date', vaccinedate, 'time', vaccinettime);

    // Schedule notifications for each vaccine
    const dueDate = parseDate(vaccinedate);
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(dueDate.getDate() - 4);
    reminderDate.setHours(0, 0, 0, 0);
    const { hours, minutes } = parseTime(vaccinettime);
    const isDuplicate = (reminders, newReminder) => {
        return reminders.some(reminder =>
            reminder.id === newReminder.id && 
            reminder.babyname === newReminder.babyname && 
            reminder.name === newReminder.name
        );
    };
    const reminder = {
        babyname: name,
        id: id,
        name: vaccinename,
        time: vaccinettime,
        dueDate: dueDate.toISOString(),
        reminderDate: reminderDate.toISOString(),
    };

    if (!isDuplicate(existingReminders, reminder)) {
        existingReminders.push(reminder);
    } else {
        console.warn(`Duplicate reminder for ${reminder.name} already exists.`);
    }
   
    reminderDate.setHours(hours);
    reminderDate.setMinutes(minutes);
    reminderDate.setSeconds(0);
    console.log('hours', hours, 'minutes', minutes, 'reminderDate', reminder.reminderDate);

    await Notifications.scheduleNotificationAsync({
        content: {
            title: 'Vaccine Reminder',
            body: `Reminder: ${vaccinename} is due on ${dueDate.toDateString()}`,
        },
        trigger: {
            date: reminderDate,
        },
    });

    // Save reminders to local file storage
    await FileSystem.writeAsStringAsync(remindersFilePath, JSON.stringify(existingReminders));
    console.log('reminder list', existingReminders);
};

export default modifyreminder;
