const express = require("express");
const router = express.Router();
const nodeRestClient = require("node-rest-client").Client;
const restClient = new nodeRestClient();

EXECUTOR_SERVER_URL = "http://localhost:5000/build_and_run";
// reigster a method
restClient.registerMethod("build_and_run", EXECUTOR_SERVER_URL, "POST");

const problemService = require("../service/problemService");

router.get("/problems", (req, res) => {
  problemService.getProblems().then(problems => res.json(problems));
});

router.get("/problems/:id", (req, res) => {
  const id = req.params.id;
  problemService.getProblem(+id).then(problem => res.json(problem));
});

router.post("/problems", (req, res) => {
  problemService
    .addProblem(req.body)
    .then(problem => res.json(problem))
    .catch(error => res.json(error));
});

router.post("/build_and_run", (req, res) => {
  const userCode = req.body.user_code;
  const lang = req.body.lang;
  console.log("lang:", lang, "code:", userCode);

  restClient.methods.build_and_run(
    {
      data: { code: userCode, lang: lang },
      headers: { "Content-Type": "application/json" }
    },
    (data, response) => {
      const text = `Build output: ${data["build"]}, execute output: ${data["run"]}`;
      res.json(data);
    }
  );
});

module.exports = router;
