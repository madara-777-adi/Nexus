import { ADJECTIVES } from "../constants/adjectives";
import { NOUNS } from "../constants/nouns";

const generateUserId
 = (): string => {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];

  const number = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");

  return `${adjective}${noun}${number}`;
};

export default generateUserId
;
