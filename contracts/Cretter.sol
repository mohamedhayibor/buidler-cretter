// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.7.0;

// From https://github.com/OpenZeppelin/openzeppelin-contracts
library SafeMath {
    function add(uint256 a, uint256 b) internal pure returns (uint256) {
        uint256 c = a + b;
        require(c >= a, "SafeMath: addition overflow");

        return c;
    }

    function sub(uint256 a, uint256 b) internal pure returns (uint256) {
        return sub(a, b, "SafeMath: subtraction overflow");
    }

    function sub(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b <= a, errorMessage);
        uint256 c = a - b;

        return c;
    }

    function mul(uint256 a, uint256 b) internal pure returns (uint256) {
        // Gas optimization: this is cheaper than requiring 'a' not being zero, but the
        // benefit is lost if 'b' is also tested.
        // See: https://github.com/OpenZeppelin/openzeppelin-contracts/pull/522
        if (a == 0) {
            return 0;
        }

        uint256 c = a * b;
        require(c / a == b, "SafeMath: multiplication overflow");

        return c;
    }

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

    function mod(uint256 a, uint256 b) internal pure returns (uint256) {
        return mod(a, b, "SafeMath: modulo by zero");
    }

    function mod(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        require(b != 0, errorMessage);
        return a % b;
    }
}

// see comments at https://github.com/0age/Spawner
contract Spawn {
  constructor(address logicContract, bytes memory initializationCalldata) {
    // delegatecall into the logic contract to perform initialization.
    (bool ok, ) = logicContract.delegatecall(initializationCalldata);
    if (!ok) {
      // pass along failure message from delegatecall and revert.
      assembly {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }

    // place eip-1167 runtime code in memory.
    bytes memory runtimeCode = abi.encodePacked(
      bytes10(0x363d3d373d3d3d363d73),
      logicContract,
      bytes15(0x5af43d82803e903d91602b57fd5bf3)
    );

    // return eip-1167 code to write it to spawned contract runtime.
    assembly {
      return(add(0x20, runtimeCode), 45) // eip-1167 runtime code, length
    }
  }
}

contract SpawnCompact {
  constructor(address logicContract, bytes memory initializationCalldata) {
    // delegatecall into the logic contract to perform initialization.
    (bool ok, ) = logicContract.delegatecall(initializationCalldata);
    if (!ok) {
      // pass along failure message from delegatecall and revert.
      assembly {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }

    // place eip-1167 runtime code in memory.
    bytes memory runtimeCode = abi.encodePacked(
      bytes10(0x363d3d373d3d3d363d6e),
      uint120(uint160(logicContract)),
      bytes15(0x5af43d82803e903d91602b57fd5bf3)
    );

    // return eip-1167 code to write it to spawned contract runtime.
    assembly {
      return(add(0x20, runtimeCode), 40) // eip-1167 runtime code, length
    }
  }
}

contract Spawner {
  function _spawn(address logicContract, bytes memory initializationCalldata) internal returns (address spawnedContract) {
    // place creation code and constructor args of contract to spawn in memory.
    bytes memory initCode = abi.encodePacked(
      type(Spawn).creationCode,
      abi.encode(logicContract, initializationCalldata)
    );

    // spawn the contract using `CREATE2`.
    spawnedContract = _spawnCreate2(initCode);
  }

  function _spawnCompact(address compactLogicContract, bytes memory initializationCalldata) internal returns (address spawnedContract) {
    // ensure that the address is sufficiently compact.
    _ensureCompact(compactLogicContract);

    // place creation code and constructor args of contract to spawn in memory.
    bytes memory initCode = abi.encodePacked(
      type(SpawnCompact).creationCode,
      abi.encode(compactLogicContract, initializationCalldata)
    );

    // spawn the contract using `CREATE2`.
    spawnedContract = _spawnCreate2(initCode);
  }

  function _spawnOldSchool(address logicContract, bytes memory initializationCalldata) internal returns (address spawnedContract) {
    // place creation code and constructor args of contract to spawn in memory.
    bytes memory initCode = abi.encodePacked(
      type(Spawn).creationCode,
      abi.encode(logicContract, initializationCalldata)
    );

    // spawn the contract using `CREATE`.
    spawnedContract = _spawnCreate(initCode);
  }

  function _spawnCompactOldSchool(address compactLogicContract, bytes memory initializationCalldata) internal returns (address spawnedContract) {
    // ensure that the address is sufficiently compact.
    _ensureCompact(compactLogicContract);

    // place creation code and constructor args of contract to spawn in memory.
    bytes memory initCode = abi.encodePacked(
      type(SpawnCompact).creationCode,
      abi.encode(compactLogicContract, initializationCalldata)
    );

    // spawn the contract using `CREATE`.
    spawnedContract = _spawnCreate(initCode);
  }

  
  function _computeNextAddress(address logicContract, bytes memory initializationCalldata) internal view returns (address target) {
    // place creation code and constructor args of contract to spawn in memory.
    bytes memory initCode = abi.encodePacked(
      type(Spawn).creationCode,
      abi.encode(logicContract, initializationCalldata)
    );

    // get target address using the constructed initialization code.
    (, target) = _getSaltAndTarget(initCode);
  }

  function _computeNextCompactAddress(address compactLogicContract, bytes memory initializationCalldata) internal view returns (address target) {
    // ensure that the address is sufficiently compact.
    _ensureCompact(compactLogicContract);

    // place creation code and constructor args of contract to spawn in memory.
    bytes memory initCode = abi.encodePacked(
      type(SpawnCompact).creationCode,
      abi.encode(compactLogicContract, initializationCalldata)
    );

    // get target address using the constructed initialization code.
    (, target) = _getSaltAndTarget(initCode);
  }

  function _spawnCreate(bytes memory initCode) private returns (address spawnedContract) {
    assembly {
      let encoded_data := add(0x20, initCode) // load initialization code.
      let encoded_size := mload(initCode)     // load the init code's length.
      spawnedContract := create(              // call `CREATE` with 3 arguments.
        callvalue(),                            // forward any supplied endowment.
        encoded_data,                         // pass in initialization code.
        encoded_size                          // pass in init code's length.
      )

      // pass along failure message from failed contract deployment and revert.
      if iszero(spawnedContract) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  function _spawnCreate2(bytes memory initCode) private returns (address spawnedContract) {
    // get salt to use during deployment using the supplied initialization code.
    (bytes32 salt, ) = _getSaltAndTarget(initCode);

    assembly {
      let encoded_data := add(0x20, initCode) // load initialization code.
      let encoded_size := mload(initCode)     // load the init code's length.
      spawnedContract := create2(             // call `CREATE2` w/ 4 arguments.
        callvalue(),                            // forward any supplied endowment.
        encoded_data,                         // pass in initialization code.
        encoded_size,                         // pass in init code's length.
        salt                                  // pass in the salt value.
      )

      // pass along failure message from failed contract deployment and revert.
      if iszero(spawnedContract) {
        returndatacopy(0, 0, returndatasize())
        revert(0, returndatasize())
      }
    }
  }

  function _getSaltAndTarget(bytes memory initCode) private view returns (bytes32 salt, address target) {
    // get the keccak256 hash of the init code for address derivation.
    bytes32 initCodeHash = keccak256(initCode);

    // set the initial nonce to be provided when constructing the salt.
    uint256 nonce = 0;
    
    // declare variable for code size of derived address.
    uint256 codeSize;

    while (true) {
      // derive `CREATE2` salt using `msg.sender` and nonce.
      salt = keccak256(abi.encodePacked(msg.sender, nonce));

      target = address(    // derive the target deployment address.
        uint160(                   // downcast to match the address type.
          uint256(                 // cast to uint to truncate upper digits.
            keccak256(             // compute CREATE2 hash using 4 inputs.
              abi.encodePacked(    // pack all inputs to the hash together.
                bytes1(0xff),      // pass in the control character.
                address(this),     // pass in the address of this contract.
                salt,              // pass in the salt from above.
                initCodeHash       // pass in hash of contract creation code.
              )
            )
          )
        )
      );

      // determine if a contract is already deployed to the target address.
      assembly { codeSize := extcodesize(target) }

      // exit the loop if no contract is deployed to the target address.
      if (codeSize == 0) {
        break;
      }

      // otherwise, increment the nonce and derive a new salt.
      nonce++;
    }   
  }   

  function _ensureCompact(address logicContract) private pure {
    // ensure that the address is sufficiently compact.
    require(
      uint160(logicContract) <= 0xffffffffffffffffffffffffffffff,
      "Logic contract address must start with at least five zero bytes."
    );
  }  
}

/*
 * This is 1st version of Cretter 2.0
 * $10 (0.04eth) to make a StatementBank
 * $1 (0.004eth) to be a Questioner (Win: gets double of stake or lose it)
 * Strict order of actions: Statement -> Questioner -> Answer -> Votes -> Finalize
 */

/*
 * Time restriction: 
 *   - 4 days question voting
 *   - 31 days statement being live 
 *   - There is only a window of 22 days which you can ask a question
 */

// This is the Stater's bank If he's with the truth
// The amount of money will keep growing until maturity
// Scheduler at 30 days kills the contract | to save space on network
// and gas refund
contract StatementBank {
    using SafeMath for uint256;

    address payable public stater; // owner

    uint256 public firstQuestioner;
    uint256 public lastQuestioner;
    uint256 public createdAt;
    uint256 public questionDeadline;
    uint256 public statementTimeLock;

    // returns the amount the statementBank has at all times
    function statementBankBalance() public view returns (uint256) {
        return address(this).balance;
    }

    // potential util for generating a random number to get
    // voter who gets reward
    // set to public for testing [TODO: must set to private]
    // arg: _numberOfVoters number of voters
    // result: starts at zero | 
    function random(uint256 _numberOfVoters) public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, block.difficulty))).mod(_numberOfVoters);
    }

    // (1): stater posts a statement
    function initialize() external {
        // payable
        // require(msg.value == 0.04 ether);
        stater = msg.sender;
        // natural unit of time on EVM is seconds
        createdAt = block.timestamp;
        // 18 days to ask a questions
        questionDeadline = block.timestamp.add(5 minutes);
        statementTimeLock = block.timestamp.add(10 minutes);
    }

    // We're using a FIFO data structure, that represents the order of
    // questions, first ones get settled first
    // firstQuestioner and lastQuestioner serve as the index for both:
    // questioners order and votes on each on those question
    // 1st arg: _questionIndex
    // result: questioner's address
    mapping (uint256 => address payable) public questioners;


    // (2): questioner asks a question
    // only question staker should be able to run this function
    // [No restriction] on when a question stake can be issued
    // [todo: Maybe deactivate when contract less than $2]
    // The more money in the contract (and less true), the more likely a questionerStake
    function questionerStake() payable public {
        // should be called before deadline
        require(questionDeadline > block.timestamp);
        require(msg.value == 0.004 ether);
        require(stater != msg.sender);
        lastQuestioner = lastQuestioner.add(1);
        questioners[lastQuestioner] = msg.sender;
    }
    
    // question got an answer from stater
    // This is to safeguard the must follow cretter: statement -> question -> answer -> votes
    // 1st arg: _questionIndex
    // 2nd arg: whether the question got answer (existence is yes/1)
    mapping (uint256 => uint256) public questionGotAnswer;
    
    // (3): stater answers to question
    // The only way for the stater to signal that he/she actually answered
    // the question is by making a transaction
    function staterProvidesAnswer(uint256 _questionIndex) public {
        require (msg.sender == stater);

        // stater can't signal he already answered a question
        // when a question hasn't been asked yet | mainly checking for existence
        require(lastQuestioner > _questionIndex);
        
        // booleans take more space than uint256
        questionGotAnswer[_questionIndex] = 1;
        
        // TODO: disable stater being able to call this function again.
        // Stater can't update or edit, an already supplied answer
        // 99 coz bearish on answers by default (100 or above, stater is winning)
        staterAgainstQuestionIndex[_questionIndex] = 99;
    }

    // 1st arg: _questionIndex
    // 2nd arg: _truthIndex
    // the truth index threshold is 100 (100 or above stater wins - starts at 99)
    // lower: stater is losing argument over the question at _questionIndex
    // higher: stater is winning argument ...
    mapping (uint256 => uint256) public staterAgainstQuestionIndex;

    // 1st arg: _questionIndex
    // 2nd arg: voterAddress
    // 3rd: 1 > signifies [voted] // existence means yes/1
    mapping (uint256 => mapping (address => uint256)) public hasAlreadyVoted;
    
    // mapping to mainly reward the lucky voter who got it right
    mapping (uint256 => address payable[]) votedForStater;
    mapping (uint256 => address payable[]) votedForQuestioner;
    
    // (4): voting
    // Vote answer on question, binary:
    // * satisfying: stater wins / Vote
    // * unsatisfying: questioner wins / Vote
    // 1st arg: _questionIndex 
    // 2nd arg: vote: 1 stater favor (agree answer), 2 questioner favor (disagree answer)
    function vote(uint256 _questionIndex, uint256 _vote) public {
        
        require(questionGotAnswer[_questionIndex] == 1);
        
        // stater or questioner can't vote
        require(msg.sender != stater);
        // This has a 0.2% gas limit addition so add it (not big)
        require(msg.sender != questioners[_questionIndex]);
        
        // if already voted _questionIndex, can't vote again
        require(hasAlreadyVoted[_questionIndex][msg.sender] != 1);
        
        // 1 stater favor (agree answer)
        if (_vote == 1) {
            staterAgainstQuestionIndex[_questionIndex] = staterAgainstQuestionIndex[_questionIndex].add(1);
            votedForStater[_questionIndex].push(msg.sender);
            
        // 2 questioner favor (disagree answer)
        } else if (_vote == 2) {
            staterAgainstQuestionIndex[_questionIndex] = staterAgainstQuestionIndex[_questionIndex].sub(1);
            votedForQuestioner[_questionIndex].push(msg.sender);
        }
        
        // record voter
        hasAlreadyVoted[_questionIndex][msg.sender] = 1;
    }
    
    
    // [Only] Scheduler can call this
    // Function [dequeue] the oldest question 
    // * To save on transfer fees and give an addictive spin:
    // * choose a random ranker who got it right and pay him $0.5
    // [originally 10% of the questioner's stake was the spec]
    function finalizeQuestionerChallenge () public returns (address removedQuestionerAddr) {
        require(lastQuestioner >= firstQuestioner);
        
        // Test still
        // require(msg.sender == address(0xa639cc7A169E848B280acd1B493a7D5Af44507a4)); 

        // If stater didn't answer, questioner wins automatically
        // 0 is the default (represent not having an answer)

        // If SAQI is 99, voters didn't move the needle, they don't get paid
        if (questionGotAnswer[firstQuestioner] == 0 || staterAgainstQuestionIndex[firstQuestioner] == 99) {
            questioners[firstQuestioner].transfer(0.008 ether);
        } else if (staterAgainstQuestionIndex[firstQuestioner] < 100) {
            // questioner wins, he gets 2x his staked money
            questioners[firstQuestioner].transfer(0.008 ether);

            // reward a random ranker who betted on questioner

            uint256 questLen = votedForQuestioner[firstQuestioner].length;

            uint256 questVoteIndex = random(questLen);

            // Important votedForStater && votedForQuestioner started with index 0
            // Must decrease by 1 for proper indexing
            address payable questionerRankingWinner = votedForQuestioner[firstQuestioner][questVoteIndex];
            
            // Variable reward: the earlier you voted the more you deserve a full reward
            
            // uint256 questVoterReward = 2000000000000000 * (1 - (questVoteIndex / questLen)); // in wei
            uint256 questVoterReward = uint256(2000000000000000).sub( uint256(2000000000000000).mul(questVoteIndex).div(questLen) );
            
            questionerRankingWinner.transfer(questVoterReward);
            
        } else if (staterAgainstQuestionIndex[firstQuestioner] >= 100) {
            // stater is winning (a tie, he's still winning) coz
            // the goal of questioner is to kill the statement
            // > nothing to do here money stays in the contract
            // > reward a random ranker who betted on stater
            
            uint256 stateLen = votedForStater[firstQuestioner].length;
            uint256 staterVoteIndex = random(stateLen);
            address payable staterRankingWinner = votedForStater[firstQuestioner][staterVoteIndex];

            
            uint256 stateVoterReward = uint256(2000000000000000).sub(uint256(2000000000000000).mul(staterVoteIndex).div(stateLen));
            staterRankingWinner.transfer(stateVoterReward);
        }
        
        removedQuestionerAddr = questioners[firstQuestioner];
        delete questioners[firstQuestioner];

        firstQuestioner = firstQuestioner.add(1);
    }
    
    // Until a stater can retrieve money from the statementBankBalance
    // [This to be implemented later]
    
    // Only Scheduler can call this
    function staterReceivesLoot() public {
        // require(msg.sender == address(0xa639cc7A169E848B280acd1B493a7D5Af44507a4));
        // should be called after deadline

        require(block.timestamp > statementTimeLock);

        
        // We need a bunch of checks here 
        // All rounds of questions challenges must be done
        // All question challenges finalized
        require(lastQuestioner == firstQuestioner);
        
        // TODO: implement time waiting requirement
        // The only strict restriction is that enough time like 2 weeks should go on
        
        // Fund future development of cretter
        uint256 fundCretterFuture = 4000000000000000; // 0.004 ether 
        address payable cretterFundAddr = 0x87aD567CE024832E60529e11e70cb3788611F1E8;
        
        cretterFundAddr.transfer(fundCretterFuture);
        stater.transfer(statementBankBalance().sub(fundCretterFuture));      
    }
    
    // Funders can donate and keep statement live
    // for more interaction even after stater withdrawal
    // Reward always goes to stater though (if not drained by questioners)
    // function donateToStatementBank() public payable {}
}

contract StatementFactory is Spawner {

  address public logicContractAddress;

  constructor(address _statementBankLogicAdrr) {
    logicContractAddress = _statementBankLogicAdrr;
  }

  function postNewStatement() public payable returns (address spawnedContract) {

    // > increased the statement stake to 0.22 eth
    // require(msg.value == 0.22 ether, "Not enough money, try 0.22");
    StatementBank statementLogic = StatementBank(logicContractAddress);

    // console.log("[postNewStatement] logicContractAddress: ", logicContractAddress);
    
    bytes memory myInitializationCalldata = abi.encodeWithSelector(
      statementLogic.initialize.selector
      // ,
      // "argumentOne",
      // "argumentTwo"
    );
    
    spawnedContract =  _spawn(
      address(statementLogic),
      myInitializationCalldata
    );

    // console.log("[postNewStatement] spawnedContract: ", spawnedContract);
  }
}