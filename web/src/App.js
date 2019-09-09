import React, {useEffect, useRef, useState} from 'react';
import {Contract, Wavelet} from 'wavelet-client';
import {Box, Flex} from '@rebass/grid';
import JSBI from 'jsbi';

const BigInt = JSBI.BigInt;

const App = () => {
    const [host, setHost] = useState('https://testnet.perlin.net');
    const [privateKey, setPrivateKey] = useState(
        Buffer.from(Wavelet.generateNewWallet().secretKey, 'binary').toString('hex')
    );
    const [client, setClient] = useState(undefined);
    const [node, setNodeInfo] = useState(undefined);
    const [contractAddress, setContractAddress] = useState(
        '7eabb6b015076bf4a2f932a75db38621f91e31e6d7cae70d046bf8ad3f11cb9e'
    );
    const [contract, setContract] = useState(undefined);

    ////////
    const [voteYear, setVoteYear] = useState('');
    const [voteLocation, setVoteLocation] = useState('');

    const [candidate1Name, setCandidate1Name] = useState('------, ------ (------)');
    const [candidate2Name, setCandidate2Name] = useState('------, ------ (------)');
    const [candidate3Name, setCandidate3Name] = useState('------, ------ (------)');
    const [candidate4Name, setCandidate4Name] = useState('------, ------ (------)');
    const [candidate5Name, setCandidate5Name] = useState('------, ------ (------)');

    const [candidate1Vote, setCandidate1Vote] = useState(0);
    const [candidate2Vote, setCandidate2Vote] = useState(0);
    const [candidate3Vote, setCandidate3Vote] = useState(0);
    const [candidate4Vote, setCandidate4Vote] = useState(0);
    const [candidate5Vote, setCandidate5Vote] = useState(0);

    const [candidate1VoteInput, setCandidate1VoteInput] = useState(0);
    const [candidate2VoteInput, setCandidate2VoteInput] = useState(0);
    const [candidate3VoteInput, setCandidate3VoteInput] = useState(0);
    const [candidate4VoteInput, setCandidate4VoteInput] = useState(0);
    const [candidate5VoteInput, setCandidate5VoteInput] = useState(0);

    const [isVoteSubmitted, setIsVoteSubmitted] = useState(undefined);

    ////////
    const [account, setAccount] = useState(undefined);
    const [contractAccount, setContractAccount] = useState(undefined);

    const accountRef = useRef(account);
    const contractAccountRef = useRef(contractAccount);

    useEffect(() => {
        accountRef.current = account;
    }, [account]);

    useEffect(() => {
        contractAccountRef.current = contractAccount;
    }, [contractAccount])

    const [sockets, setSockets] = useState({
        accounts: undefined,
        contract: undefined,
        consensus: undefined
    });

    const socketsRef = useRef(sockets);
    useEffect(() => {
        socketsRef.current = sockets;
    }, [sockets]);

    const fetchCandidateVoteNames = (contract, wallet) => {
        setCandidate1Name(contract.test(wallet, 'get_candidate1_name', BigInt(0)).logs);
        setCandidate2Name(contract.test(wallet, 'get_candidate2_name', BigInt(0)).logs);
        setCandidate3Name(contract.test(wallet, 'get_candidate3_name', BigInt(0)).logs);
        setCandidate4Name(contract.test(wallet, 'get_candidate4_name', BigInt(0)).logs);
        setCandidate5Name(contract.test(wallet, 'get_candidate5_name', BigInt(0)).logs);
    }

    const fetchCandidateVoteRanks = (contract, wallet) => {
        setCandidate1Vote(contract.test(wallet, 'get_candidate1_vote', BigInt(0)).logs);
        setCandidate2Vote(contract.test(wallet, 'get_candidate2_vote', BigInt(0)).logs);
        setCandidate3Vote(contract.test(wallet, 'get_candidate3_vote', BigInt(0)).logs);
        setCandidate4Vote(contract.test(wallet, 'get_candidate4_vote', BigInt(0)).logs);
        setCandidate5Vote(contract.test(wallet, 'get_candidate5_vote', BigInt(0)).logs);
    }

    const fetchIsVoted = (contract, wallet) => {
        setIsVoteSubmitted(contract.test(wallet, 'is_vote_submitted', BigInt(0)).logs);
    }

    const fetchVoteSettings = (contract, wallet) => {
        setVoteYear(contract.test(wallet, 'get_vote_year', BigInt(0)).logs);
        setVoteLocation(contract.test(wallet, 'get_vote_location', BigInt(0)).logs);
    }

    const resetCandidateVote = () => {
        setCandidate1Vote(0);
        setCandidate2Vote(0);
        setCandidate3Vote(0);
        setCandidate4Vote(0);
        setCandidate5Vote(0);
    }

    const resetCandidateVoteInput = () => {
        setCandidate1VoteInput(0);
        setCandidate2VoteInput(0);
        setCandidate3VoteInput(0);
        setCandidate4VoteInput(0);
        setCandidate5VoteInput(0);
    }

    const resetVoteSettings = () => {
        setVoteYear('');
        setVoteLocation('');
        setIsVoteSubmitted(undefined);

        setCandidate1Name('------, ------ (------)');
        setCandidate2Name('------, ------ (------)');
        setCandidate3Name('------, ------ (------)');
        setCandidate4Name('------, ------ (------)');
        setCandidate5Name('------, ------ (------)');
    }

    const reset = () => {
        setClient(undefined);
        setAccount(undefined);
        setContractAccount(undefined);
        setNodeInfo(undefined);

        setContract(undefined);
        setContractAddress('');

        resetCandidateVote();
        resetCandidateVoteInput();
        resetVoteSettings();

        const sockets = socketsRef.current;

        if (sockets.accounts) {
            sockets.accounts.close(1000, 'connection closing normally');
        }

        if (sockets.contract) {
            sockets.contract.close(1000, 'connection closing normally');
        }

        if (sockets.consensus) {
            sockets.consensus.close(1000, 'connection closing normally');
        }

        setSockets({accounts: undefined, consensus: undefined});
    };

    const connect = async () => {
        if (client === undefined) {
            try {
                const client = new Wavelet(host);
                setNodeInfo(await client.getNodeInfo());

                const wallet = Wavelet.loadWalletFromPrivateKey(privateKey);
                const walletAddress = Buffer.from(wallet.publicKey).toString('hex');
                setAccount(await client.getAccount(walletAddress));

                setClient(client);

                sockets.accounts = await client.pollAccounts(
                    {
                        onAccountUpdated: msg => {
                            switch (msg.event) {
                                case 'balance_updated': {
                                    setAccount({...accountRef.current, balance: msg.balance});
                                    break;
                                }
                                default: {
                                    break;
                                }
                            }
                        }
                    },
                    {id: walletAddress}
                );

                setSockets(sockets);
            } catch (error) {
                reset();
                alert(error);
            }
        } else {
            reset();
        }
    };

    const load = async () => {
        setContractAccount(await client.getAccount(contractAddress));

        // Initialize
        const contract = new Contract(client, contractAddress);
        await contract.init();

        const wallet = Wavelet.loadWalletFromPrivateKey(privateKey);

        // Every single time consensus happens on Wavelet, query for the latest
        // vote logs by calling 'fetchCandidateVoteRanks()' on the smart contract.

        sockets.consensus = await client.pollConsensus({
            onRoundEnded: _ => {
                if (contract === undefined) {
                    return;
                }

                (async () => {
                    await contract.fetchAndPopulateMemoryPages();
                    fetchCandidateVoteRanks(contract, wallet);
                    fetchIsVoted(contract, wallet);
                })();
            }
        });

        sockets.contract = await client.pollAccounts(
            {
                onAccountUpdated: msg => {
                    switch (msg.event) {
                        case 'gas_balance_updated': {
                            setContractAccount({...contractAccountRef.current, gas_balance: msg.gas_balance});
                            break;
                        }
                        default: {
                            break;
                        }
                    }
                }
            },
            {id: contractAddress}
        );

        setSockets(sockets);

        fetchVoteSettings(contract, wallet);
        fetchCandidateVoteNames(contract, wallet);
        fetchCandidateVoteRanks(contract, wallet);
        fetchIsVoted(contract, wallet);

        setContract(contract);
    };

    const sendVoteValue = async () => {
        const wallet = Wavelet.loadWalletFromPrivateKey(privateKey);
        await contract.call(wallet, 'send_vote', BigInt(0), BigInt(250000), BigInt(0), {
            type: 'string',
            value: candidate1VoteInput + ',' + candidate2VoteInput + ',' + candidate3VoteInput + ',' + candidate4VoteInput + ',' + candidate5VoteInput
        });

        resetCandidateVoteInput();
    };

    return (
        <>

            <Flex>

              <Box width="49%">

                <Box className="boxstyle">

                  <h2 className="text-center title">
                      LOAD ELECTION CONTRACT
                  </h2>

                  <Flex mb={2} alignItems="center">
                      <Box flex="0 0 100px">
                          <label>[Secret]</label>
                      </Box>
                      <Box flex="1">
                          <input
                              type="text"
                              value={privateKey}
                              disabled={client}
                              data-lpignore="true"
                              onChange={evt => setPrivateKey(evt.target.value)}
                          />
                      </Box>
                  </Flex>

                  <Flex mb={2} alignItems="center">
                      <Box flex="0 0 100px">
                          <label>[Node]</label>
                      </Box>
                      <Box flex="1">
                          <Flex width={1}>
                              <Box width={9 / 12}>
                                  <input
                                      type="text"
                                      value={host}
                                      disabled={client}
                                      data-lpignore="true"
                                      onKeyPress={async e => {
                                          if (e.key === 'Enter') {
                                              await connect();
                                          }
                                      }}
                                      onChange={evt => setHost(evt.target.value)}
                                  />
                              </Box>
                              <Box width={3 / 12} style={{minWidth: '10em'}} ml={2}>
                                  <button
                                      style={{width: '100%'}}
                                      onClick={connect}
                                      disabled={privateKey.length !== 128}
                                  >
                                      {client ? 'Disconnect' : 'Connect'}
                                  </button>
                              </Box>
                          </Flex>
                      </Box>
                  </Flex>

                  <Flex alignItems="center">
                      <Box flex="0 0 100px">
                          <label>[Contract]</label>
                      </Box>
                      <Box flex="1">
                          <Flex width={1}>
                              <Box width={9 / 12}>
                                  <input
                                      type="text"
                                      value={contractAddress}
                                      placeholder="input chat smart contract address..."
                                      disabled={!client}
                                      data-lpignore="true"
                                      onKeyPress={async e => {
                                          if (e.key === 'Enter') await load();
                                      }}
                                      onChange={evt => setContractAddress(evt.target.value)}
                                  />
                              </Box>
                              <Box width={3 / 12} style={{minWidth: '10em'}} ml={2}>
                                  <button
                                      style={{width: "100%"}}
                                      disabled={!client || contractAddress.length !== 64}
                                      onClick={load}
                                  >
                                      Load Ballot Paper
                                  </button>
                              </Box>
                          </Flex>
                      </Box>
                  </Flex>

                  <Flex alignItems="center">
                    <Box>
                        <ul alignItems="left">
                          <li>You will login with your secret</li>
                          <li>Load contract popuplate the Ballot paper with election information</li>
                        </ul>
                      </Box>
                  </Flex>

                </Box>

                <Box className="boxstyle" mt={20}>

                  <h2 className="text-center title">
                      CURRENT VOTING RESULTS
                  </h2>

                  <Flex mb={2} alignItems="center">
                      <Box flex="0 0 300px">
                        <label>
                          {`${candidate1Name}`}
                        </label>
                      </Box>
                      <Box flex="1" style={{minWidth: 0}}>
                        <span className="truncate" title={`${node && node.public_key ? node.public_key : '???'}`}>
                          {`${candidate1Vote}`}
                        </span>
                      </Box>
                  </Flex>

                  <Flex mb={2} alignItems="center">
                      <Box flex="0 0 300px">
                        <label>
                          {`${candidate2Name}`}
                        </label>
                      </Box>
                      <Box flex="1" style={{minWidth: 0}}>
                        <span className="truncate" title={`${node && node.public_key ? node.public_key : '???'}`}>
                          {`${candidate2Vote}`}
                        </span>
                      </Box>
                  </Flex>

                  <Flex mb={2} alignItems="center">
                      <Box flex="0 0 300px">
                        <label>
                          {`${candidate3Name}`}
                        </label>
                      </Box>
                      <Box flex="1" style={{minWidth: 0}}>
                        <span className="truncate" title={`${node && node.public_key ? node.public_key : '???'}`}>
                          {`${candidate3Vote}`}
                        </span>
                      </Box>
                  </Flex>

                  <Flex mb={2} alignItems="center">
                      <Box flex="0 0 300px">
                        <label>
                          {`${candidate4Name}`}
                        </label>
                      </Box>
                      <Box flex="1" style={{minWidth: 0}}>
                        <span className="truncate" title={`${node && node.public_key ? node.public_key : '???'}`}>
                          {`${candidate4Vote}`}
                        </span>
                      </Box>
                  </Flex>

                  <Flex mb={2} alignItems="center">
                      <Box flex="0 0 300px">
                        <label>
                          {`${candidate5Name}`}
                        </label>
                      </Box>
                      <Box flex="1" style={{minWidth: 0}}>
                        <span className="truncate" title={`${node && node.public_key ? node.public_key : '???'}`}>
                          {`${candidate5Vote}`}
                        </span>
                      </Box>
                  </Flex>

                  <Flex alignItems="center">
                    <Box>
                        <ul alignItems="left">
                          <li>Election information is displayed once you load up the Contract</li>
                        </ul>
                      </Box>
                  </Flex>

                </Box>

              </Box>

              <Box width="49%" className="boxstyle" ml={20}>

                <h2 className="text-center title">
                    BALLOT PAPER
                </h2>

                <Flex mb={2} alignItems="center">
                    <Box flex="0 0 100px">
                        <label>YEAR:</label>
                    </Box>
                    <Box flex="1" style={{minWidth: 0}}>
                      <span className="truncate">
                        {`${voteYear}`}
                      </span>
                    </Box>
                </Flex>

                <Flex mb={4} alignItems="center">
                    <Box flex="0 0 100px">
                        <label>LOCATION:</label>
                    </Box>
                    <Box flex="1" style={{minWidth: 0}}>
                      <span className="truncate">
                        {`${voteLocation}`}
                      </span>
                    </Box>
                </Flex>

                <Flex mb={2} alignItems="center">
                    <Box flex="0 0 40px">
                      <input
                          disabled={!client || !contract || parseInt(isVoteSubmitted) === 1}
                          type="number"
                          data-lpignore="true"
                          min="1"
                          max="5"
                          step="1"
                          placeholder="0"
                          value={candidate1VoteInput}
                          onChange={evt => setCandidate1VoteInput(evt.target.value)}
                      />
                    </Box>
                    <Box flex="1" style={{minWidth: 0}} ml={30}>
                        <label>
                          {`${candidate1Name}`}
                        </label>
                    </Box>
                </Flex>

                <Flex mb={2} alignItems="center">
                    <Box flex="0 0 40px">
                      <input
                          disabled={!client || !contract || parseInt(isVoteSubmitted) === 1}
                          type="number"
                          data-lpignore="true"
                          min="1"
                          max="5"
                          step="1"
                          placeholder="0"
                          value={candidate2VoteInput}
                          onChange={evt => setCandidate2VoteInput(evt.target.value)}
                      />
                    </Box>
                    <Box flex="1" style={{minWidth: 0}} ml={30}>
                        <label>
                          {`${candidate2Name}`}
                        </label>
                    </Box>
                </Flex>

                <Flex mb={2} alignItems="center">
                    <Box flex="0 0 40px">
                      <input
                          disabled={!client || !contract || parseInt(isVoteSubmitted) === 1}
                          type="number"
                          data-lpignore="true"
                          min="1"
                          max="5"
                          step="1"
                          placeholder="0"
                          value={candidate3VoteInput}
                          onChange={evt => setCandidate3VoteInput(evt.target.value)}
                      />
                    </Box>
                    <Box flex="1" style={{minWidth: 0}} ml={30}>
                        <label>
                          {`${candidate3Name}`}
                        </label>
                    </Box>
                </Flex>

                <Flex mb={2} alignItems="center">
                    <Box flex="0 0 40px">
                      <input
                          disabled={!client || !contract || parseInt(isVoteSubmitted) === 1}
                          type="number"
                          data-lpignore="true"
                          min="1"
                          max="5"
                          step="1"
                          placeholder="0"
                          value={candidate4VoteInput}
                          onChange={evt => setCandidate4VoteInput(evt.target.value)}
                      />
                    </Box>
                    <Box flex="1" style={{minWidth: 0}} ml={30}>
                        <label>
                          {`${candidate4Name}`}
                        </label>
                    </Box>
                </Flex>

                <Flex mb={2} alignItems="center">
                    <Box flex="0 0 40px">
                      <input
                          disabled={!client || !contract || parseInt(isVoteSubmitted) === 1}
                          type="number"
                          data-lpignore="true"
                          min="1"
                          max="5"
                          step="1"
                          placeholder="0"
                          value={candidate5VoteInput}
                          onChange={evt => setCandidate5VoteInput(evt.target.value)}
                      />
                    </Box>
                    <Box flex="1" style={{minWidth: 0}} ml={30}>
                        <label>
                          {`${candidate5Name}`}
                        </label>
                    </Box>
                </Flex>

                <Flex alignItems="center">
                  <Box>
                      <ul alignItems="left">
                        <li>Repeating candidate number is not allowed</li>
                        <li>You can only vote once, multiple vsubmit is not allowed</li>
                      </ul>
                    </Box>
                </Flex>

                <Flex alignItems="center" >

                  <Box className="votebuttonstyle">

                      <button
                          style={{width: '100px'}}
                          disabled={
                              !client ||
                              !contract ||
                              !account ||
                              account.balance < 2 ||
                              parseInt(isVoteSubmitted) === 1 ||
                              contractAccount.gas_balance + account.balance < 250000 ||
                              (
                                parseInt(candidate1VoteInput) +
                                parseInt(candidate2VoteInput) +
                                parseInt(candidate3VoteInput) +
                                parseInt(candidate4VoteInput) +
                                parseInt(candidate5VoteInput)
                              ) !== 15
                          }
                          onClick={sendVoteValue}
                      >
                      Submit Vote
                      </button>

                  </Box>

                </Flex>

                <Flex alignItems="center">
                  <Box flex="1">
                    <span>
                      {`${parseInt(isVoteSubmitted) === 1 ? 'Vote is submitted' : ''}`}
                    </span>
                  </Box>
                </Flex>

              </Box>

            </Flex>

            <Flex>
              <Box flex="1" className="perlstyle">
                  <span>
                  {`[BALANCE ${
                    account && account.balance ? account.balance : 0
                  } PERL(s)]`}
                  </span>
              </Box>
            </Flex>

        </>
    );
};

export default App;
