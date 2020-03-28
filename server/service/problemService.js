// let problems = [
//   {
//     id: 1,
//     name: "Two Sum",
//     desc: "Sum to numbers",
//     difficulty: "easy"
//   }
// ];

const Problem = require("../models/Problem");

const getProblems = async () => {
  try {
    return await Problem.find();
  } catch (error) {
    return error.message;
  }
};

const getProblem = async id => {
  try {
    const problem = await Problem.findOne({ id });
    return problem;
  } catch (error) {
    return error.message;
  }
};

const addProblem = newProblem => {
  return new Promise((resolve, reject) => {
    Problem.findOne({ name: newProblem.name }, (err, data) => {
      if (data) {
        reject("problem already exists");
      } else {
        Problem.countDocuments({}, (err, count) => {
          newProblem.id = count + 1;
          let mongo = new Problem(newProblem);
          mongo.save();
          resolve(mongo);
        });
      }
    });
  });
};

module.exports = {
  getProblems,
  getProblem,
  addProblem
};
