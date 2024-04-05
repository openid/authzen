import { User } from "./interfaces";

const users = {
  "CiRmZDA2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "rick@the-citadel.com",
    "name": "Rick Sanchez",
    "email": "rick@the-citadel.com",
    "roles": ["admin", "evil_genius"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Rick%20Sanchez.jpg"
  },
  "rick@the-citadel.com": {
    "id": "rick@the-citadel.com",
    "name": "Rick Sanchez",
    "email": "rick@the-citadel.com",
    "roles": ["admin", "evil_genius"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Rick%20Sanchez.jpg"
  },
  "CiRmZDM2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "beth@the-smiths.com",
    "name": "Beth Smith",
    "email": "beth@the-smiths.com",
    "roles": ["viewer"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Beth%20Smith.jpg"
  },
  "beth@the-smiths.com": {
    "id": "beth@the-smiths.com",
    "name": "Beth Smith",
    "email": "beth@the-smiths.com",
    "roles": ["viewer"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Beth%20Smith.jpg"
  },
  "CiRmZDE2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "morty@the-citadel.com",
    "name": "Morty Smith",
    "email": "morty@the-citadel.com",
    "roles": ["editor"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Morty%20Smith.jpg"
  },
  "morty@the-citadel.com": {
    "id": "morty@the-citadel.com",
    "name": "Morty Smith",
    "email": "morty@the-citadel.com",
    "roles": ["editor"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Morty%20Smith.jpg"
  },
  "CiRmZDI2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "summer@the-smiths.com",
    "name": "Summer Smith",
    "email": "summer@the-smiths.com",
    "roles": ["editor"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Summer%20Smith.jpg"
  },
  "summer@the-smiths.com": {
    "id": "summer@the-smiths.com",
    "name": "Summer Smith",
    "email": "summer@the-smiths.com",
    "roles": ["editor"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Summer%20Smith.jpg"
  },
  "CiRmZDQ2MTRkMy1jMzlhLTQ3ODEtYjdiZC04Yjk2ZjVhNTEwMGQSBWxvY2Fs": {
    "id": "jerry@the-smiths.com",
    "name": "Jerry Smith",
    "email": "jerry@the-smiths.com",
    "roles": ["viewer"],
    "picture": "https://www.topaz.sh/assets/templates/citadel/img/Jerry%20Smith.jpg"
  },
  "jerry@the-smiths.com": {
    "id": "jerry@the-smiths.com",
    "name": "Jerry Smith",
    "email": "jerry@the-smiths.com",
    "roles": ["viewer"],
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
