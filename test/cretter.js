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



  // Interaction tests
  // 1. addr1, addr2, addr3 ask questions > check statement balance

  // 2. owner provides answer
  // 3. addr2 votes down answer
  // 4. check proper finalization

});