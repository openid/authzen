import { User } from "./interfaces";

const users = {
  "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
      "key": "rick@the-citadel.com",
      "name": "Rick Sanchez",
      "email": "rick@the-citadel.com",
      "picture": "https://www.topaz.sh/assets/templates/citadel/img/Rick%20Sanchez.jpg"
  },
  "rick@the-citadel.com": {
    "key": "rick@the-citadel.com",
    "name": "Rick Sanchez",
    "email": "rick@the-citadel.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Rick%20Sanchez.jpg"
  },
  "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "key": "beth@the-smiths.com",
    "name": "Beth Smith",
    "email": "beth@the-smiths.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Beth%20Smith.jpg"
  },
  "beth@the-smiths.com": {
    "key": "beth@the-smiths.com",
    "name": "Beth Smith",
    "email": "beth@the-smiths.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Beth%20Smith.jpg"
  },
  "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "key": "morty@the-citadel.com",
    "name": "Morty Smith",
    "email": "morty@the-citadel.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Morty%20Smith.jpg"
  },
  "morty@the-citadel.com": {
    "key": "morty@the-citadel.com",
    "name": "Morty Smith",
    "email": "morty@the-citadel.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Morty%20Smith.jpg"
  },
  "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "key": "summer@the-smiths.com",
    "name": "Summer Smith",
    "email": "summer@the-smiths.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Summer%20Smith.jpg"
  },
  "summer@the-smiths.com": {
    "key": "summer@the-smiths.com",
    "name": "Summer Smith",
    "email": "summer@the-smiths.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Summer%20Smith.jpg"
  },
  "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "key": "jerry@the-smiths.com",
    "name": "Jerry Smith",
    "email": "jerry@the-smiths.com",
    "pict,ure": "https://www.topaz.sh/assets/templates/citadel/img/Jerry%20Smith.jpg"
  },
  "jerry@the-smiths.com": {
    "key": "jerry@the-smiths.com",
    "name": "Jerry Smith",
    "email": "jerry@the-smiths.com",
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Jerry%20Smith.jpg"
  }
}

export class Directory {
  constructor() {
  }
    
  async getUserByIdentity(identity: string): Promise<User> {
    return users[identity];
  }

  async getUserById(id: string): Promise<User> {
    return users[id];
  }
}
