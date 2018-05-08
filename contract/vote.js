'use strict';

var VoteContent = function (text) {
  if (text) {
    var o = JSON.parse(text);
    this.choice = new BigNumber(o.choice);
    this.description = o.description;
  } else {
    this.choice = new BigNumber(-1);
    this.description = '';
  }
};

VoteContent.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
};

var VoteContract = function () {
  LocalContractStorage.defineMapProperty(this, "voteMp", {
    parse: function (text) {
      return new VoteContent(text);
    },
    stringify: function (o) {
      return o.toString();
    }
  });

  LocalContractStorage.defineProperties(this, {
    startBlockHeight: -1,
    endBlockHeight: -1
  });
};


// save vote to contract, one user can only vote once
VoteContract.prototype = {
  init: function (start, end) {
    // 千万不要 this.endBlockHeight = new BigNumber(end)  这样无效..
    this.startBlockHeight = start;
    this.endBlockHeight = end;
  },
  vote: function (choice, description) {
    var from = Blockchain.transaction.from;
    var bk_height = new BigNumber(Blockchain.block.height);
    var originStart = new BigNumber(-1);
    var originEnd = new BigNumber(-1);
    choice = choice + "";
    choice = choice.trim();
    description = description.trim();

    if (originStart.eq(this.startBlockHeight) || originEnd.eq(this.endBlockHeight)) {
      throw new Error("vote has not set start end time");
    }
    if (bk_height.lt(this.startBlockHeight)) {
      throw new Error("vote has not start.");
    }
    if (bk_height.gt(this.endBlockHeight)) {
      throw new Error("vote is end.");
    }
    if (choice === "" || description === ""){
        throw new Error("empty choice / description");
    }
    if (choice.length > 64 || description.length > 64){
        throw new Error("choice / description exceed limit length")
    }

    var historyVote = this.voteMp.get(from);
    if (historyVote) {
      throw new Error("has voted before.");
    }

    var vote = new VoteContent();
    vote.choice = choice;
    vote.description = description;

    this.voteMp.put(from, vote);
  },
  get: function () {
    var from = Blockchain.transaction.from;
    return this.voteMp.get(from);
  }
};
module.exports = VoteContract;