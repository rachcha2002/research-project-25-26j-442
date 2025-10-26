// weightData.js

const weightData = [
    { age: 0, lowerWeight: 2.4, upperWeight: 4.3 },
    { age: 1, lowerWeight: 3.2, upperWeight: 5.8 },
    { age: 2, lowerWeight: 4.0, upperWeight: 7.1 },
    { age: 3, lowerWeight: 4.6, upperWeight: 7.9 },
    { age: 4, lowerWeight: 5.1, upperWeight: 8.6 },
    { age: 5, lowerWeight: 5.5, upperWeight: 9.2 },
    { age: 6, lowerWeight: 5.8, upperWeight: 9.7 },
    { age: 7, lowerWeight: 6.1, upperWeight: 10.2 },
    { age: 8, lowerWeight: 6.3, upperWeight: 10.5 },
    { age: 9, lowerWeight: 6.5, upperWeight: 10.9 },
    { age: 10, lowerWeight: 6.7, upperWeight: 11.2 },
    { age: 11, lowerWeight: 6.9, upperWeight: 11.5 },
    { age: 12, lowerWeight: 7.0, upperWeight: 11.8 },
    { age: 13, lowerWeight: 7.3, upperWeight: 12.1 },
    { age: 14, lowerWeight: 7.5, upperWeight: 12.4 },
    { age: 15, lowerWeight: 7.7, upperWeight: 12.7 },
    { age: 16, lowerWeight: 7.9, upperWeight: 13.0 },
    { age: 17, lowerWeight: 8.1, upperWeight: 13.3 },
    { age: 18, lowerWeight: 8.3, upperWeight: 13.8 },
    { age: 19, lowerWeight: 8.5, upperWeight: 14.0 },
    { age: 20, lowerWeight: 8.7, upperWeight: 14.2 },
    { age: 21, lowerWeight: 8.8, upperWeight: 14.4 },
    { age: 22, lowerWeight: 9.0, upperWeight: 14.7 },
    { age: 23, lowerWeight: 9.2, upperWeight: 14.9 },
    { age: 24, lowerWeight: 9.6, upperWeight: 15.4 },
    { age: 25, lowerWeight: 9.8, upperWeight: 15.7 },
    { age: 26, lowerWeight: 10.0, upperWeight: 16.0 },
    { age: 27, lowerWeight: 10.2, upperWeight: 16.3 },
    { age: 28, lowerWeight: 10.4, upperWeight: 16.6 },
    { age: 29, lowerWeight: 10.5, upperWeight: 16.7 },
    { age: 30, lowerWeight: 10.7, upperWeight: 16.8 },
    { age: 31, lowerWeight: 10.9, upperWeight: 17.0 },
    { age: 32, lowerWeight: 11.0, upperWeight: 17.3 },
    { age: 33, lowerWeight: 11.2, upperWeight: 17.5 },
    { age: 34, lowerWeight: 11.4, upperWeight: 17.7 },
    { age: 35, lowerWeight: 11.6, upperWeight: 18.0 },
    { age: 36, lowerWeight: 11.8, upperWeight: 18.2 },
  ];
  
  // Function to get the weight range for a specific age
  function getWeightRange(age) {
    const data = weightData.find(item => item.age === age);
    if (data) {
      return { lowerWeight: data.lowerWeight, upperWeight: data.upperWeight };
    } else {
      return null;
    }
  }
  
  // Example usage:
  const age = 12;
  const weightRange = getWeightRange(age);
  if (weightRange) {
    console.log(`At age ${age} months, the weight range is:`);
    console.log(`Lower weight: ${weightRange.lowerWeight} kg`);
    console.log(`Upper weight: ${weightRange.upperWeight} kg`);
  } else {
    console.log("Age not found.");
  }
  
  export { getWeightRange, weightData };
  