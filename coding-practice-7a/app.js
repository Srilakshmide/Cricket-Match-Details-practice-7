const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let database = null;

const initializeDbServer = async () => {
  try {
    database = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbServer();

//API 1 Returns a list of all the players in the player table

const ConvertToObjectResponsePlayer = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersQueryResponse = await database.all(getPlayersQuery);
  response.send(
    playersQueryResponse.map((eachItem) =>
      ConvertToObjectResponsePlayer(eachItem)
    )
  );
});

// API 2 Returns a specific player based on the player ID

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerDetailsQuery = `SELECT * FROM player_details 
    WHERE player_id=${playerId};`;
  const playerDetailsResponse = await database.get(getPlayerDetailsQuery);
  response.send(ConvertToObjectResponsePlayer(playerDetailsResponse));
});

//API 3 Updates the details of a specific player based on player ID

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerDetailsQuery = `UPDATE player_details SET 
  player_name= '${playerName}' WHERE player_id=${playerId};`;
  const playerDetailsResponse = await database.run(updatePlayerDetailsQuery);
  response.send("Player Details Updated");
});

//API 4 Returns the match details of a specific match

const ConvertToObjectResponseMatch = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT * FROM match_details 
    WHERE match_id=${matchId};`;
  const matchDetailsResponse = await database.get(getMatchDetailsQuery);
  response.send(ConvertToObjectResponseMatch(matchDetailsResponse));
});

//API 5 Returns a list of all the matches of a player

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchQuery = `SELECT * FROM player_match_score
    NATURAL JOIN match_details WHERE player_id = ${playerId};`;
  const playerMatchResponse = await database.all(getPlayerMatchQuery);
  response.send(
    playerMatchResponse.map((eachItem) =>
      ConvertToObjectResponseMatch(eachItem)
    )
  );
});

//API 6 Returns a list of players of a specific match

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayerQuery = `SELECT * FROM player_match_score
    NATURAL JOIN player_details WHERE match_id=${matchId};`;
  const matchPlayerResponse = await database.all(getMatchPlayerQuery);
  response.send(
    matchPlayerResponse.map((eachItem) =>
      ConvertToObjectResponsePlayer(eachItem)
    )
  );
});

//API 7 statistics of total score,fours,sixes of a player based on player ID

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerStatsQuery = `SELECT 
    player_id AS playerId, player_name AS playerName,
    SUM(score) AS totalScore,SUM(fours) AS totalFours,SUM(sixes) AS totalSixes
    FROM player_match_score
    NATURAL JOIN player_details
    WHERE player_id = ${playerId};`;
  const playerStatsResponse = await database.get(getPlayerStatsQuery);
  response.send(playerStatsResponse);
});

module.exports = app;
