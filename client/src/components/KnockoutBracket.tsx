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
  const map: Record<string, number> = {
    "Финал": 1,
    "Хагас финал": 2,
    "Дөрөвийн финал": 3,
    "1/8 финал": 4,
    "1/16 финал": 5,
    "1/32 финал": 6,
  };
  return map[match.round as string] ?? 99;
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

