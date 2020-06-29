# Cretter Rinkeby

This is the testing on Tuesday at meetup.

## Design params

To ask question: 5 minutes
statement timelock: 10 minutes




# Production design Time params

* 22 days window to ask a question
* By 26 days all questions closed out
* On 31th day contract is killed

# Architechture

```
(1)           (2)           (3)       (4)
Stater      Questioner     Stater    Voter       Firebase
                                                 Scheduler
Post      -> Stake      -> Post   -> Rank     -> Calls for challenge
Statement    Question      Answer    Answer      resolution (finality)
```





## Future (cretter 3.0)

Due to Firebase auth we're protected from sybil attacks. Hence ideally voters don't have to pay gas in order to vote. (They sign it, our server sends the transaction)

Our server keeps track when the questioner's stake should be resolved and send a transaction that Finalize sending either the questioner's 2x reward or letting funds inside the contract.