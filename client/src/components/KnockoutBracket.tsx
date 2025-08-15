import React, { useState } from "react";
import "./knockout.css";

interface Player {
  id: string;
  name: string;
}

interface BracketMatch {
  id: string;
  round: number | string;
  roundName?: string;
  player1?: Player;
  player2?: Player;
  player1Score?: string;
  player2Score?: string;
  score?: string;
  winner?: Player;
  position?: { x: number; y: number };
}

interface KnockoutBracketProps {
  matches: BracketMatch[];
  onPlayerClick?: (playerId: string) => void;
}

const roundClassNames = ["one", "two", "three", "four", "five", "six"]; // support up to 6 rounds

function getRoundNumber(match: BracketMatch): number {
  if (typeof match.round === "number") return match.round;

  // Normalize round string to handle different languages/cases
  const key = (match.round || "")
    .toString()
    .toLowerCase();

  // Map various round names (English & Mongolian) to an ordered number
  // The larger the number, the further to the right the column appears
  const map: Record<string, number> = {
    // Early rounds
    "1/32 финал": 1,
    "round of 64": 1,
    "1/16 финал": 2,
    "round of 32": 2,
    "1/8 финал": 3,
    "round of 16": 3,
    // Quarterfinals
    "дөрөвийн финал": 4,
    "quarterfinal": 4,
    // Semifinals
    "хагас финал": 5,
    "semifinal": 5,
    // Finals and similar end-stage matches
    "финал": 6,
    "final": 6,
    "third_place_playoff": 6,
    "3-р байрын тоглолт": 6,
  };

  return map[key] ?? 99;
}

export function KnockoutBracket({ matches, onPlayerClick }: KnockoutBracketProps) {
  const [darkTheme, setDarkTheme] = useState(true);

  const handlePlayerClick = (id?: string) => {
    if (id && onPlayerClick) onPlayerClick(id);
  };

  // Group matches by round number
  const roundGroups = new Map<number, BracketMatch[]>();
  matches.forEach((match) => {
    const roundNum = getRoundNumber(match);
    if (!roundGroups.has(roundNum)) roundGroups.set(roundNum, []);
    roundGroups.get(roundNum)!.push(match);
  });

  const rounds = Array.from(roundGroups.keys()).sort((a, b) => a - b);

  return (
    <div className={`knockout theme ${darkTheme ? "theme-dark-trendy" : ""}`}>
      <div className="bracket">
        {rounds.map((round, idx) => {
          const columnMatches = roundGroups.get(round)!;
          const columnClass = roundClassNames[idx] || "";
          return (
            <div className={`column ${columnClass}`} key={round}>
              {columnMatches.map((match) => {
                const [score1, score2] = match.score
                  ? match.score.split("-").map((s) => s.trim())
                  : [match.player1Score || "", match.player2Score || ""];
                const winnerClass = match.winner
                  ? match.winner.id === match.player1?.id
                    ? "winner-top"
                    : match.winner.id === match.player2?.id
                    ? "winner-bottom"
                    : ""
                  : "";
                return (
                  <div key={match.id} className={`match ${winnerClass}`}>
                    <div
                      className="match-top team"
                      onClick={() => handlePlayerClick(match.player1?.id)}
                    >
                      <span className="image"></span>
                      <span className="seed"></span>
                      <span className="name">{match.player1?.name || "TBD"}</span>
                      <span className="score">{score1 || "-"}</span>
                    </div>
                    <div
                      className="match-bottom team"
                      onClick={() => handlePlayerClick(match.player2?.id)}
                    >
                      <span className="image"></span>
                      <span className="seed"></span>
                      <span className="name">{match.player2?.name || "TBD"}</span>
                      <span className="score">{score2 || "-"}</span>
                    </div>
                    <div className="match-lines">
                      <div className="line one"></div>
                      <div className="line two"></div>
                    </div>
                    <div className="match-lines alt">
                      <div className="line one"></div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="theme-switcher">
        <h2>Select a theme</h2>
        <button
          id="theme-dark-trendy"
          onClick={() => setDarkTheme((prev) => !prev)}
        >
          Dark Trendy
        </button>
      </div>
    </div>
  );
}

