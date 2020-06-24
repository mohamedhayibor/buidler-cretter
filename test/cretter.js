const { expect } = require("chai");

const { ethers } = require("@nomiclabs/buidler");

const eth = require("ethers");


describe("Token contract", function() {
  let StatementBank;
  let statement;
  let owner, addr1, addr2, addr3, addrs;

  before(async function () {
    StatementBank = await ethers.getContractFactory("StatementBank")

    it("If user did not send 0.04 eth to fund the statement, tx must fail", async function () {
      statement = await StatementBank.deploy();
      expect( await statement.deployed() ).to.be.revertedWith("Fund statement");
    });
  })

  beforeEach(async function() {
    statement = await StatementBank.deploy({ value: eth.utils.parseEther("0.04") })
    await statement.deployed();

    [owner, addr1, addr2, addr3, ...addrs] = await ethers.getSigners();
  })

  // Set up tests
  /*
  it("Stater must be owner of the contract", async function() {
    const stater = await statement.stater();
    expect(stater).to.equal(await owner.getAddress());
  });

  it("Contract deployment params", async function() {
    const lastQuestioner = await statement.lastQuestioner();
    const firstQuestioner = await statement.firstQuestioner();

    expect(lastQuestioner).to.equal(0);
    expect(firstQuestioner).to.equal(1);
  });

  it("StatementBankBalance must be 0.04 eth at deployment ", async function() {
    const statementBankBalance = await statement.statementBankBalance();
    expect( statementBankBalance.toString() ).to.equal("40000000000000000");
  });

  it("Addr1 stakes 0.004 eth to ask a question", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });
    let statementBankBalance = await statement.statementBankBalance();
    expect(statementBankBalance).to.equal("44000000000000000");
  });

  it("Addr1, addr2, addr3 ask a question, stater answer question 2", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr2).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr3).questionerStake({ value: eth.utils.parseEther("0.004") });

    await statement.staterProvidesAnswer(1);
    let questionGotAnswer = await statement.questionGotAnswer(1);

    expect(questionGotAnswer).to.equal(1);

    let statementBankBalance = await statement.statementBankBalance();
    expect(statementBankBalance).to.equal("52000000000000000");
  });

  it("Addr3 votes answer question 2", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr2).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr3).questionerStake({ value: eth.utils.parseEther("0.004") });

    await statement.staterProvidesAnswer(1);

    await statement.connect(addr3).vote(1, 2);

    let staterAgainstQuestionIndex = await statement.staterAgainstQuestionIndex(1);

    expect(staterAgainstQuestionIndex).to.equal(98);

  });

  it("2 downVotes then finalize", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr2).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr3).questionerStake({ value: eth.utils.parseEther("0.004") });

    await statement.staterProvidesAnswer(0);

    await statement.connect(addr3).vote(0, 2);
    await statement.connect(addr2).vote(0, 2);

    await statement.finalizeQuestionerChallenge();

    expect(await statement.firstQuestioner() ).to.equal(1);
    expect(await statement.lastQuestioner() ).to.equal(3);

  });


  // Voting Tests
  // Make sure all Finalization outcomes are covered:
  // 1. No answer > questioner wins
  // 2. if no votes staterAgainstQuestionIndex [SAQI] is 99
  // https://ethereum-waffle.readthedocs.io/en/latest/matchers.html

  it("If questioner didn't get answer from stater, he wins by default", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") })
    expect( () => statement.finalizeQuestionerChallenge()).to.changeBalances([owner, addr1], [eth.utils.parseEther("0.004"), -eth.utils.parseEther("0.004")]);
  })


  it("Stater provides an answer but no votes, SAQI must be 99, stater loses", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") })
    await statement.staterProvidesAnswer(0);
    await statement.finalizeQuestionerChallenge();
    let SAQI = await statement.staterAgainstQuestionIndex(0);

    expect(SAQI).to.equal(99);
  });
*/

  it("Stater receives whatever is left", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr2).questionerStake({ value: eth.utils.parseEther("0.004") });

    await statement.staterProvidesAnswer(0);
    await statement.staterProvidesAnswer(1);

    await statement.connect(addr3).vote(0, 2);
    await statement.connect(addr2).vote(0, 2);


    await statement.finalizeQuestionerChallenge();

    await statement.connect(addr3).vote(1, 2);
    await statement.connect(addr2).vote(1, 2);

    await statement.finalizeQuestionerChallenge();

    // let cretterFundAddr = "0x87aD567CE024832E60529e11e70cb3788611F1E8";

    // expect( () => statement.staterReceivesLoot().catch(err => err) ).to.changeBalance(cretterFundAddr, "4000000000000000");

    // await statement.connect(addr1).vote(1, 2);
    // await statement.connect(addr3).vote(1, 2);
  });

});