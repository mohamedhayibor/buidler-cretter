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

  it("Stater must be owner of the contract", async function() {
    const stater = await statement.stater();
    expect(stater).to.equal(await owner.getAddress());
  });



  it("StatementBankBalance must be 0.04 eth at deployment ", async function() {
    const statementBankBalance = await statement.statementBankBalance();
    expect( statementBankBalance.toString() ).to.equal("40000000000000000");
  });



});