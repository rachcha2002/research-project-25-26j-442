import images from "../../constants/images"
import Images from "../../constants/images"

const formatTime = (timeString) => {
  // Split the time string into components
  const [time, modifier] = timeString.split(' ');
  let [hours, minutes] = time.split(':');

  // Convert hours to 24-hour format
  hours = parseInt(hours, 10);
  if (modifier === 'PM' && hours < 12) {
    hours += 12; // Convert PM hour
  }
  if (modifier === 'AM' && hours === 12) {
    hours = 0; // Convert 12 AM to 0 hours
  }

  // Format back to hh:mm AM/PM
  const formattedTime = new Date(1970, 0, 1, hours, minutes).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  return formattedTime;
};

export const vaccineList = [
    {
      "id": 1,
      "name": "BCG",
      "description": "Administered at birth to prevent tuberculosis.",
      "image": Images.BCG,
      "dueInWeeks": 0,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": "",
      "status": "pending"
    },
    {
      "id": 2,
      "name": "Pentavalent (DTP, HepB, Hib) + OPV (1st Dose)",
      "description": "Combination vaccine to prevent diphtheria, tetanus, hepatitis B, and Haemophilus influenzae type B.",
      "image": images.Penta,
      "dueInWeeks": 8,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": "",
      "status": "pending"
    },
    {
      "id": 3,
      "name": "Pentavalent (DTP, HepB, Hib) + OPV (2nd Dose)",
      "description": "Second dose of combination vaccine to prevent diphtheria, tetanus, hepatitis B, and Haemophilus influenzae type B.",
      "image": images.Penta,
      "dueInWeeks": 16,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": "",
      "status": "pending"
    },
    {
      "id": 4,
      "name": "Pentavalent (DTP, HepB, Hib) + OPV (3rd Dose)",
      "description": "Third dose of combination vaccine to prevent diphtheria, tetanus, hepatitis B, and Haemophilus influenzae type B.",
      "image": images.Penta,
      "dueInWeeks": 24,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": ``,
      "status": "pending"
    },
    {
      "id": 5,
      "name": "JE Vaccine",
      "description": "Prevents Japanese Encephalitis, given at 9 months.",
      "image": images.JE,
      "dueInWeeks": 39,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": "",
      "status": "pending"
    },
    {
      "id": 6,
      "name": "MMR (1st Dose)",
      "description": "   CDC recommends that people get MMR vaccine to protect against measles, mumps, and rubella. Children should get two doses of MMR vaccine, starting with the first dose at 12 to 15 months of age.",
      "image": images.MMR,
      "dueInWeeks": 52,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": "",
      "status": "pending"
    },
    {
      "id": 7,
      "name": "DTP + OPV ",
      "description": "Fourth dose of diphtheria, tetanus, and polio.",
      "image": images.OPV,
      "dueInWeeks": 78,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": "",
      "status": "pending"
    },
    {
      "id": 8,
      "name": "MMR (2nd Dose)",
      "description": "Second dose to prevent measles, mumps, and rubella.",
      "image": images.MMR,
      "dueInWeeks": 156,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": "",
      "status": "pending"
    },
    {
      "id": 9,
      "name": "DTP + OPV (Final Boost)",
      "description": "Final booster dose of diphtheria and polio, administered at 5 years.",
      "image": images.OPV,
      "dueInWeeks": 260,
      "dueDate":"",
      Time: formatTime("08:00 AM"),
      "batchNo": "",
      "specialDetails": "",
      "status": "pending"
    }
  ]
  