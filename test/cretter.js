const { expect } = require("chai");

const { ethers } = require("@nomiclabs/buidler");

const eth = require("ethers");


describe("Token contract", function() {
  let StatementBank;
  let statement;
  let owner, addr1, addr2, addrs;

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

    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
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

  // Interaction tests
  // 1. addr1 asks question
  // 2. owner provides answer
  // 3. addr2 votes down answer
  // 4. check proper finalization

});