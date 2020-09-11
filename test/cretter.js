const { expect } = require("chai");
const { ethers } = require("@nomiclabs/buidler");
const eth = require("ethers");


describe("Token contract", function() {
  let StatementBankContract;
  let CretterFactoryContract;

  let statementLogicDeploy;
  let statementFactoryDeploy;
  
  let owner, addr1, addr2, addr3, addr4;
  let currentStatementAddress;

  let statement;

  // before(async function () {
  //   StatementBankContract = await ethers.getContractFactory("StatementBank");
  //   CretterFactoryContract = await ethers.getContractFactory("StatementFactory");
  // })

  before(async function() {
    StatementBankContract = await ethers.getContractFactory("StatementBank");
    CretterFactoryContract = await ethers.getContractFactory("StatementFactory");

    statementLogicDeploy = await StatementBankContract.deploy();
    await statementLogicDeploy.deployed();

    currentStatementAddress = statementLogicDeploy.address;
    console.log("Statement Logic deployed to: ", currentStatementAddress);

    statementFactoryDeploy = await CretterFactoryContract.deploy(currentStatementAddress);
    await statementFactoryDeploy.deployed();

    console.log("statementContractFactory: ", statementFactoryDeploy.address);
    [owner, addr1, addr2, addr3, addr4] = await ethers.getSigners();


    // Fire newStatementClone
    await statementFactoryDeploy.postNewStatement();

    // console.log(newStatementClone)
    statement = StatementBankContract.attach("0xc451eb00627adfa5880868eda62493466c5bafbd")

    // check main contract
    // let statementLogicInstance = StatementBankContract.attach("0x7c2C195CD6D34B8F845992d380aADB2730bB9C6F")

    // check
    // let factoryInstance = CretterFactoryContract.attach("0x8858eeB3DfffA017D4BCE9801D340D36Cf895CCf")

  });


  it("Critical path - ONE", async function () {
    console.log("Hit first Unit test!!!!!!");

    // console.log(await newStatementCloneInstance.statementBankBalance())
    // console.log(await statementLogicInstance.statementBankBalance())
    // console.log(await factoryInstance.statementBankBalance())
    

    // check if you can fund contract
    // it works

    console.log(">> EOA Sending: ", owner._address)

    await statement.deposit({ value: eth.utils.parseEther("0.13") });


    console.log(">>> Depositing into clone works: ", (await statement.statementBankBalance()).toString())

    console.log(">>> Statement creator: ", await statement.stater())

    console.log(">>> Statement creation Time: ", (await statement.createdAt()).toString())

    console.log(">>> StatementDeadline: ", (await statement.questionDeadline()).toString())

    console.log(">>> Statement statementTimeLock: ", (await statement.statementTimeLock()).toString())


    await statement.connect(addr2).questionerStake({ value: eth.utils.parseEther("0.004") });

    await statement.staterProvidesAnswer(0);

    await statement.finalizeQuestionerChallenge();

    // Time travelling to end of statementTimeLock
    let statementTimeLock = await statement.statementTimeLock();
    await ethers.provider.send("evm_mine", [Number(statementTimeLock.toString())]);


    await statement.staterReceivesLoot();
  });

  /*
  it("Addr1, addr2, addr3 ask a question, stater answer question 2", async function () {
    // await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });
    

    await statement.connect(addr2).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr3).questionerStake({ value: eth.utils.parseEther("0.004") });

    await statement.staterProvidesAnswer(1);
    
    // let questionGotAnswer = await statement.questionGotAnswer(1);

    // expect(questionGotAnswer).to.equal(1);

    // let statementBankBalance = await statement.statementBankBalance();
    // expect(statementBankBalance).to.equal("52000000000000000");
  });



  it("Depositing 0.1 eth into clone contract", async function () {
    // Fire newStatementClone
    await statementFactoryDeploy.postNewStatement({ value: eth.utils.parseEther("0.22") });

    // console.log(newStatementClone)
    let newStatementCloneInstance = StatementBankContract.attach("0xc451eb00627adfa5880868eda62493466c5bafbd");

    await newStatementCloneInstance.deposit({ value: eth.utils.parseEther("0.1") });

    expect((await newStatementCloneInstance.statementBankBalance()).toString()).to.equal("100000000000000000");
  })

  it("Any amount different than 0.004 eth stake will fail to ask question", async function () {
    let stakeWrongAmount = statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.008") });
    await expect(stakeWrongAmount).to.be.reverted;
    // let newStatementClone = await statementFactoryDeploy.connect(addr1).postNewStatement({ value: eth.utils.parseEther("0.22") }); // ();
  });

  it("Stater should NOT be able to signal answer, when question is not already asked", async function() {
    await expect(statement.staterProvidesAnswer(0)).to.be.reverted;
  });

  it("Stater must be owner of the contract", async function() {
    const stater = await statement.stater();
    expect(stater).to.equal(await owner.getAddress());
  });

  it("Contract deployment params", async function() {
    const lastQuestioner = await statement.lastQuestioner();
    const firstQuestioner = await statement.firstQuestioner();

    expect(lastQuestioner).to.equal(0);
    expect(firstQuestioner).to.equal(0);
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

  it("Can't vote unless there is an answer already", async function() {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });

    await expect(statement.connect(addr3).vote(0, 2)).to.be.reverted;
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

  it("2 downVotes then finalize, checking first and last index", async function () {
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


  it("Stater loses, SAQI of less than 99", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr2).questionerStake({ value: eth.utils.parseEther("0.004") });

    await statement.staterProvidesAnswer(0);
    await statement.staterProvidesAnswer(1);

    await statement.connect(addr3).vote(0, 2);
    await statement.connect(addr2).vote(0, 2);

    expect( await statement.staterAgainstQuestionIndex(0) ).to.equal(97);

    await statement.finalizeQuestionerChallenge();

    await statement.connect(addr3).vote(1, 2);

    expect( await statement.staterAgainstQuestionIndex(1) ).to.equal(98);

    await statement.finalizeQuestionerChallenge();

    // Time travelling to end of statementTimeLock
    let statementTimeLock = await statement.statementTimeLock();
    await ethers.provider.send("evm_mine", [Number(statementTimeLock.toString())]);

    await statement.staterReceivesLoot();
  });

  it("Stater wins SAQI of a 100+", async function () {
    await statement.connect(addr1).questionerStake({ value: eth.utils.parseEther("0.004") });
    await statement.connect(addr2).questionerStake({ value: eth.utils.parseEther("0.004") });

    await statement.staterProvidesAnswer(0);
    await statement.staterProvidesAnswer(1);

    await statement.connect(addr3).vote(0, 1);
    await statement.connect(addr2).vote(0, 1);


    expect( await statement.staterAgainstQuestionIndex(0) ).to.equal(101);

    await statement.finalizeQuestionerChallenge();

    await statement.connect(addr3).vote(1, 1);

    expect( await statement.staterAgainstQuestionIndex(1) ).to.equal(100);

    await statement.finalizeQuestionerChallenge();

    // Time travelling to end of statementTimeLock
    let statementTimeLock = await statement.statementTimeLock();
    await ethers.provider.send("evm_mine", [Number(statementTimeLock.toString())]);

    await statement.staterReceivesLoot();
  });
  */
});