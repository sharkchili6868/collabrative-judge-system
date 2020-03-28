const redisClient = require("../module/redisClient");
const TIMEOUT_IN_SECONDS = 3600;

module.exports = io => {
  const sessionPath = "/editorSocket/";
  const collaborations = {};

  const socketIdToSessionId = {};

  io.on("connection", socket => {
    let sessionId = socket.handshake.query["sessionId"];

    socketIdToSessionId[socket.id] = sessionId;

    if (sessionId in collaborations) {
      collaborations[sessionId]["participants"].push(socket.id);
    } else {
      redisClient.get(sessionPath + "/" + sessionId, data => {
        if (data) {
          console.log("session terminated previously, get back from redis");
          collaborations[sessionId] = {
            cachedInstructions: JSON.parse(data),
            participants: []
          };
        } else {
          console.log("creating new session");
          collaborations[sessionId] = {
            cachedInstructions: [],
            participants: []
          };
        }
        collaborations[sessionId]["participants"].push(socket.id);
      });
    }

    socket.on("restoreBuffer", () => {
      let sessionId = socketIdToSessionId[socket.id];
      console.log(
        "restore buffer for session" + sessionId,
        "socket id:" + socket.id
      );
      if (sessionId in collaborations) {
        let instructions = collaborations[sessionId]["cachedInstructions"];
        for (let i = 0; i < instructions.length; i++) {
          socket.emit(instructions[i][0], instructions[i][1]);
        }
      } else {
        console.log("could not find any collaboration for this session");
      }
    });

    socket.on("disconnect", function() {
      let sessionId = socketIdToSessionId[socket.id];
      console.log("disconnect session" + sessionId, "socket id:" + socket.id);
      let foundAndRemoved = false;
      if (sessionId in collaborations) {
        let participants = collaborations[sessionId]["participants"];
        let index = participants.indexOf(socket.id);
        // if find then remove
        if (index >= 0) {
          // remove the participants
          participants.splice(index, 1);
          foundAndRemoved = true;
          // then check if this is the last participants
          if (participants.length == 0) {
            console.log(
              "last participant iin collaboration, committing to redis and remove from memory"
            );

            let key = sessionPath + "/" + sessionId;
            // convert JSON object into string
            let value = JSON.stringify(
              collaborations[sessionId]["cachedInstructions"]
            );
            // store into redis
            redisClient.set(key, value, redisClient.redisPrint);
            // set expire time
            redisClient.expire(key, TIMEOUT_IN_SECONDS);
            delete collaborations[sessionId];
          }
        }
      }
      if (!foundAndRemoved) {
        // if reach here, debug needed
        console.log("Warning: could not find the socket.id in collaborations");
      }
    });
  });

  io.on("change", delta => {
    console.log("change " + socketIdToSessionId[socket.id] + " " + delta);
    let sessionId = socketIdToSessionId[socket.id];
    if (sessionId in collaborations) {
      let participants = collaborations[sessionId]["participants"];

      for (let i = 0; i < participants.length; i++) {
        if (socket.id != participants[i]) {
          io.to(participants[i]).emit("change", delta);
        }
      }
    } else {
      console.log("could not tie socket id to any collaboration");
    }
  });
};
