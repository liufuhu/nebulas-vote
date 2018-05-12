'use strict';

var QuestionContent = function (text) {
  if (text) {
    var o = JSON.parse(text);
    this.id = o.id;
    this.description = o.description;
    this.answers = o.answers;
    this.creator = o.creator;
    this.startBlockHeight = new BigNumber(o.startBlockHeight);
    this.endBlockHeight = new BigNumber(o.endBlockHeight);
  } else {
    this.id = '';
    this.description = '';
    this.answers = '';
    this.creator = '';
    this.startBlockHeight = -1;
    this.endBlockHeight = -1;
  }
};

QuestionContent.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
};

var VoteContent = function (text) {
  if (text) {
    var o = JSON.parse(text);
    this.choice = new BigNumber(o.choice);
  } else {
    this.choice = new BigNumber(-1);
  }
};

VoteContent.prototype = {
  toString: function () {
    return JSON.stringify(this);
  }
};

var questionSplitFlag = '##*@#*';
var idDescriptionSplitFlag = '&$@@&';
var answersSplitFlag = '**@@*#';

var VoteContract = function () {
  LocalContractStorage.defineMapProperties(this, {
    voteMap: {
      parse: function (text) {
        return new VoteContent(text);
      },
      stringify: function (o) {
        return o.toString();
      }
    },
    questionMap: {
      parse: function (text) {
        return new QuestionContent(text);
      },
      stringify: function (o) {
        return o.toString();
      }
    },
    creatorMap: null,
    userVotedMap: null,
    questionVotedMap: null,
  })
};


// save vote to contract, one user can only vote once
VoteContract.prototype = {
  init: function () {
    // 千万不要 this.endBlockHeight = new BigNumber(end)  这样无效..
  },
  // 创建题目
  create: function (description, answers, start, end) {
    var from = Blockchain.transaction.from;
    var timestamp = Blockchain.transaction.timestamp;
    var bk_height = new BigNumber(Blockchain.block.height);
    start = new BigNumber(start);
    end = new BigNumber(end);
    if (bk_height.gt(end)) {
      throw new Error("the vote end time is smaller than now");
    }
    var question = new QuestionContent();
    question.description = description;
    question.answers = answers;
    question.creator = from;
    question.startBlockHeight = start;
    question.endBlockHeight = end;
    question.id = from + '' + timestamp;
    this.questionMap.set(question.id, question);

    var creatorQuestionIds = this.creatorMap.get(from);
    var idDes = [question.id,question.description].join(idDescriptionSplitFlag);
    if (!creatorQuestionIds) {
      creatorQuestionIds = idDes;
    } else {
      var list = creatorQuestionIds.split(questionSplitFlag);
      list.push(idDes);
      creatorQuestionIds = list.join(questionSplitFlag);
    }
    this.creatorMap.set(from, creatorQuestionIds);

    console.log('created vote is ' + JSON.stringify(question));
    console.log('creator created vote is ' + JSON.stringify(creatorQuestionIds));

    return question;
  },
  getCreatorQuestions: function() {
    var from = Blockchain.transaction.from;
    // return this.creatorMap.get(from);
    var questions = this.creatorMap.get(from);
    console.log('creator created vote is ' + JSON.stringify(questions));
    return questions;
  },
  getQuestion: function(id) {
    return this.questionMap.get(id);
  },
  vote: function (qid, choice) {
    var from = Blockchain.transaction.from;
    var bk_height = new BigNumber(Blockchain.block.height);
    var question = this.questionMap.get(qid);
    var userOptId = from + '' + qid; 
    choice = parseInt(choice);
    
    if (!question) {
      throw new Error("no such vote");
    }
    var answers = (question.answers||'').split(answersSplitFlag);
    if (choice < 0 || answers.length < choice+1) {
      throw new Error("no such choice");
    }
    if (bk_height.lt(question.startBlockHeight)) {
      throw new Error("vote has not start.");
    }
    if (bk_height.gt(question.endBlockHeight)) {
      throw new Error("vote is end.");
    }

    var historyVote = this.voteMap.get(userOptId);
    if (historyVote) {
      throw new Error("has voted before.");
    }

    // 用户和题目组成一个维度
    var vote = new VoteContent();
    vote.choice = choice;
    this.voteMap.put(userOptId, vote);

    // 用户维度的投票统计
    var voted = this.userVotedMap.get(from);
    var newVoted = [qid, question.description].join(idDescriptionSplitFlag);
    if (!voted) {
      voted = newVoted;
    } else {
      var votedArr = voted.split(questionSplitFlag);
      votedArr.push(newVoted);
      voted = votedArr.join(questionSplitFlag);
    }
    this.userVotedMap.put(from, voted);

    // 题目维度的投票统计
    var questionVoted = this.questionVotedMap.get(qid);
    var choiceInt = parseInt(choice);
    var voteCountArr;
    if (!questionVoted) {
      voteCountArr = [];
      for (var i=0; i<answers.length; i++) {
        if (i == choiceInt) {
          voteCountArr.push(1);
        } else {
          voteCountArr.push(0);
        }
      }
    } else {
      var voteCountArr = questionVoted.split(answersSplitFlag);
      voteCountArr[choiceInt] = voteCountArr[choiceInt]*1+1;
    }
    this.questionVotedMap.put(qid, voteCountArr.join(answersSplitFlag));
  },
  getQuestionVoteInfo: function (qid) {
    return this.questionVotedMap.get(qid);
  },
  getUserQuestionVoteInfo: function (qid) {
    var from = Blockchain.transaction.from;
    var userOptId = from + '' + qid; 
    return this.voteMap.get(userOptId);
  },
  getUserVoteInfo: function () {
    var from = Blockchain.transaction.from;
    return this.userVotedMap.get(from);
  }
};
module.exports = VoteContract;