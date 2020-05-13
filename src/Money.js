const { EventEmitter } = require("events");

class Money extends EventEmitter {
  constructor(manager, options = {}) {
    super();

    this.client = manager.client;

    this.userID = options.userID;
    this.money = options.money || 0;

    this.manager = manager;
    this.options = options;
  }

  get data() {
    let baseData = {
      userID: this.userID,
      guildID: this.guildID,
      money: this.money
    };

    if (this.options.userID) baseData.userID = this.options.userID;
    if (this.options.guildID) baseData.guildID = this.options.guildID;
    if (this.options.money) baseData.money = this.options.money;

    return baseData;
  }

  edit(userID,options = {}) {
    new Promise(async (resolve, reject) => {
     
      if (userID) this.userID = userID;
      if (options.guildID) this.guildID = options.guildID;
      if (options.money) this.money = options.money;

      this.manager.money =  this.manager.money.filter(
        m => m.userID !== this.userID || m.guildID !== this.guildID
      );

      this.manager.money.push(this.data);

      this.manager.editMoney(this.userID, this.data);

      resolve(this);
    });
  }
}
module.exports = Money;