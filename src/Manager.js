const { EventEmitter } = require("events");
const mergeOptions = require("merge-options");
const { writeFile, readFile, exists } = require("fs");
const { promisify } = require("util");
const writeFileAsync = promisify(writeFile);
const existsAsync = promisify(exists);
const readFileAsync = promisify(readFile);

const { MoneyManager } = require("./Util");
const Money = require("./Money");

class MoneysManager extends EventEmitter {
  constructor(client, options) {
    super();

    this.client = client;

    this.options = mergeOptions(MoneyManager, options);

    this.money = [];

    this.client.on("message", message => {
      if (
        !this.money.find(
          m => m.userID === message.author.id && m.guildID === message.guild.id
        )
      ) {
        let money = new Money(this, {
          userID: message.author.id,
          guildID: message.guild.id,
          money: 0
        })
        this.money.push(
          money.data
        );
        this.emit('moneyCreated',message.author,message.guild)
        this.saveMoney(message.author.id, this.money);
      }
    });

    this._init();
  }

  addMoney(userID, options = {}) {
    new Promise(async (resolve, reject) => {
      if (!userID) return reject(`Invalid User ID`);
      if (!options.guildID) return reject(`Invalid Guild ID`);
      if (!options.money || options.money < 0)
        return reject(`Invalid money length`);

      let userMoney = this.money.find(
        m => m.userID === userID && m.guildID === options.guildID
      );
      
      
      if (!userMoney){
        return reject('No user found with ID ' + userID)
      }

      let money = new Money(this,{
        guildID: options.guildID,
        userID: userID,
        money: userMoney.money += options.money
      })
      
      money.edit(userID, money.data)

      this.emit(
        "moneyAdded",
        this.client.guilds.cache.get(options.guildID).members.fetch(userID),
        this.client.guilds.cache.get(options.guildID),
        money.data
      );

      resolve()
    });

  }

  removeMoney(userID, options = {}) {
    new Promise(async (resolve, reject) => {
      if (!userID) return reject(`Invalid User ID`);
      if (!options.guildID) return reject(`Invalid Guild ID`);
      if (!options.money || options.money < 0)
        return reject(`Invalid money length`);

      let userMoney = this.money.find(
        m => m.userID === userID && m.guildID === options.guildID
      );

      if (!userMoney) {
        return reject('No user found with ID ' + userID)
      }
      
      let money = new Money(this, {
        guildID: options.guildID,
        userID: userID,
        money: userMoney.money - options.money
      })

      money.edit(userID, money.data)

      this.emit('moneyRemoved', this.client.users.fetch(userID), this.client.guilds.cache.get(options.guildID), money.data)

      resolve()
    });
  }

  getUser(userID,options = {}){
    if (!userID) return reject(`Invalid User ID`);
    if (!options.guildID) return reject(`Invalid Guild ID`);

    let userMoney = this.money.find(
      m => m.userID === userID && m.guildID === options.guildID
    );

    if (!userMoney) {
      return reject('No user found with ID ' + userID)
    }
    return userMoney;
  }

  async refreshStorage() {
    return true;
  }

  async getAllMoney() {
    let storageExists = await existsAsync(this.options.storage);
    if (!storageExists) {
      await writeFileAsync(this.options.storage, "[]", "utf-8");
      return [];
    } else {
      let storageContent = await readFileAsync(this.options.storage);
      try {
        let moneys = await JSON.parse(storageContent);
        if (Array.isArray(moneys)) {
          return moneys;
        } else {
          console.log(storageContent, moneys);
          throw new SyntaxError("The storage file is not properly formatted.");
        }
      } catch (e) {
        if (e.message === "Unexpected end of JSON input") {
          throw new SyntaxError(
            "The storage file is not properly formatted.",
            e
          );
        } else {
          throw e;
        }
      }
    }
  }

  async saveMoney(_userID, _moneyData) {
    await writeFileAsync(
      this.options.storage,
      JSON.stringify(this.money),
      "utf-8"
    );
    this.refreshStorage();
    return;
  }

  async editMoney(_userID, _moneyData) {
    await writeFileAsync(
      this.options.storage,
      JSON.stringify(this.money),
      "utf-8"
    );
    this.refreshStorage();
    return;
  }

  async _init() {
    this.money = await this.getAllMoney();
    this.ready = true;
  }
}
module.exports = MoneysManager;
