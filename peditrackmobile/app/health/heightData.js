// heightData.js

const heightData = [
    { age: 0, lowerHeight: 46.0, upperHeight: 54.7 },
    { age: 1, lowerHeight: 51.1, upperHeight: 60.0 },
    { age: 2, lowerHeight: 54.7, upperHeight: 63.5 },
    { age: 3, lowerHeight: 57.6, upperHeight: 66.2 },
    { age: 4, lowerHeight: 60.0, upperHeight: 68.6 },
    { age: 5, lowerHeight: 62.0, upperHeight: 70.7 },
    { age: 6, lowerHeight: 63.8, upperHeight: 72.5 },
    { age: 7, lowerHeight: 65.4, upperHeight: 74.1 },
    { age: 8, lowerHeight: 66.8, upperHeight: 75.6 },
    { age: 9, lowerHeight: 68.2, upperHeight: 77.0 },
    { age: 10, lowerHeight: 69.5, upperHeight: 78.4 },
    { age: 11, lowerHeight: 70.7, upperHeight: 79.7 },
    { age: 12, lowerHeight: 72.0, upperHeight: 81.0 },
    { age: 13, lowerHeight: 73.2, upperHeight: 82.3 },
    { age: 14, lowerHeight: 74.4, upperHeight: 83.6 },
    { age: 15, lowerHeight: 75.6, upperHeight: 84.8 },
    { age: 16, lowerHeight: 76.8, upperHeight: 86.0 },
    { age: 17, lowerHeight: 77.9, upperHeight: 87.2 },
    { age: 18, lowerHeight: 79.0, upperHeight: 88.4 },
    { age: 19, lowerHeight: 80.0, upperHeight: 89.5 },
    { age: 20, lowerHeight: 81.0, upperHeight: 90.6 },
    { age: 21, lowerHeight: 82.0, upperHeight: 91.6 },
    { age: 22, lowerHeight: 83.0, upperHeight: 92.7 },
    { age: 23, lowerHeight: 84.0, upperHeight: 93.7 },
    { age: 24, lowerHeight: 85.0, upperHeight: 94.7 },
    { age: 25, lowerHeight: 85.9, upperHeight: 95.7 },
    { age: 26, lowerHeight: 86.8, upperHeight: 96.6 },
    { age: 27, lowerHeight: 87.7, upperHeight: 97.6 },
    { age: 28, lowerHeight: 88.6, upperHeight: 98.5 },
    { age: 29, lowerHeight: 89.5, upperHeight: 99.4 },
    { age: 30, lowerHeight: 90.3, upperHeight: 100.3 },
    { age: 31, lowerHeight: 91.2, upperHeight: 101.1 },
    { age: 32, lowerHeight: 92.0, upperHeight: 102.0 },
    { age: 33, lowerHeight: 92.8, upperHeight: 102.8 },
    { age: 34, lowerHeight: 93.6, upperHeight: 103.6 },
    { age: 35, lowerHeight: 94.4, upperHeight: 104.4 },
    { age: 36, lowerHeight: 95.2, upperHeight: 105.2 },
  ];
  
  // Function to get the height range for a specific age
  function getHeightRange(age) {
    const data = heightData.find(item => item.age === age);
    if (data) {
      return { lowerHeight: data.lowerHeight, upperHeight: data.upperHeight };
    } else {
      return null;
    }
  }
  
  // Example usage:
  const age = 12;
  const heightRange = getHeightRange(age);
  if (heightRange) {
    console.log(`At age ${age} months, the height range is:`);
    console.log(`Lower height: ${heightRange.lowerHeight} cm`);
    console.log(`Upper height: ${heightRange.upperHeight} cm`);
  } else {
    console.log("Age not found.");
  }
  
  export { getHeightRange, heightData };
  