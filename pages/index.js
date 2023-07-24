import Head from 'next/head';
import Image from 'next/image';
import {NFT_ABI, NFT_CONTRACT, DAO_ABI, DAO_CONTRACT} from "../constants";
import {utils, Contract, providers, BigNumber} from "ethers";
import Web3Modal from "web3modal";
import styles from '@/styles/Home.module.css';
import { useEffect, useRef, useState } from 'react';
import { Web3Provider } from '@ethersproject/providers';


export default function Home() {

  //Keep track of the loading status
  const [loading, setLoading] = useState(false);
  //Keep track of the wallet connected status
  const [walletConnected, setWalletConnected] = useState(false);
  //Keep track of the tab selected 
  const [selectedTab, setSelectedTab] = useState("");
  //Keep track of the owner 
  const [isOwnerm, setIsOwner] = useState(false);
  //Keep track of the proposal data
  const [proposals, setproposals] = useState([]);
  //Keep track of the current proposals
  const [currentProposalId, setCurrentProposalId] = useState("");
  //Keep track of the number of proposals
  const [numProposal, setNumProposal] = useState(0);
  //Keep track of the number of NFT
  const [nftBalance, setnftBalance] = useState(0);
  //Keep track of treasury balance
  const [treasuryBalance, setTreasuryBalance] = useState(BigNumber.from(0));
  //Keep track of CreateFormData
  const [createFormData, setCreateFormData] = useState({tokenAddress: "", ethAmount: ""})  
  //Reference to the provider
  const web3ModalRef = useRef();
  
  
  //Auxilary functions

  //Get signer or provider
  const getSignerOrProvider = async(needSigner=false) => {
    //get the provider and connect 
    const provider = await web3ModalRef.current.connect();
    //get web3 provider
    const web3Provider = new providers.Web3Provider(provider);
    //Get the chain id
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 5) {
      window.alert("Please switch to the Goerli network");
      throw new Error("Please switch to the goerli network")
    }
    if (needSigner==true) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  }

  //Connect wallet
  const walletConnect = async() => {
    try {
      await getSignerOrProvider();
      setWalletConnected(true);      
    } catch (err) {
      console.error(err.message);      
    }
  }

  
  //Useeffect to react to the change in the connection status
  useEffect(() => {

    if(!walletConnected) {
      //Create reference to the web3 provider
      web3ModalRef.current = new Web3Modal({
        network: "goerli",
        providerOptions: {},
        disableInjectedProvider: false,
      });

      walletConnect();
      getIsOwner();
      getNftBalance();
      getNumProposals();
      getTreasuryBalance();
      getProposals();
      

      

    }
  }
    ,[walletConnected])

  //View functions
  //Get the owner of the contract
  const getIsOwner = async() => {
    try {
      //Get the provider
      const provider = await getSignerOrProvider();
      //Create an instance of the DAO contract
      const daoContract = new Contract(DAO_CONTRACT, DAO_ABI, provider);
      //Get the signer 
      const signer = await getSignerOrProvider(true);
      //Get the address of signer
      const address = await signer.getAddress();
      //Get the owner of the contract
      const _owner = await daoContract.owner();
      if (address.toLowerCase() === _owner.toLowerCase()) {
        setIsOwner(true);
      }
      
    } catch (err) {
      console.error(err);
    }
  }
  //Get the number of NFT that the wallet hold
  const getNftBalance = async() => {
    try {
      //Get the provider
      const provider = await getSignerOrProvider();
      //Create an instance of the NFT contract
      const daoContract = new Contract(NFT_CONTRACT, NFT_ABI, provider);
      //Get the signer 
      const signer = await getSignerOrProvider(true);
      //Get the address of signer
      const address = await signer.getAddress();
      //Get the balance of NFT
      const _nftBalance = await daoContract.balanceOf(address);
      setnftBalance(_nftBalance.toNumber());
      
    } catch (err) {
      console.error(err);
    }
  }

  //Get the number of proposals

  const getNumProposals = async() => {
    try {
      //Get the provider
      const provider = await getSignerOrProvider();
      //Create an instance of the DAO contract
      const daoContract = new Contract(DAO_CONTRACT, DAO_ABI, provider);
      //Get the number of proposals
      const _numProposal = await daoContract.numProposals();
      setNumProposal(_numProposal.toNumber());
      
    } catch (err) {
      console.error(err);
    }
  }

  //Get the treasury balance 

  const getTreasuryBalance = async() => {
   try {
     //get the provider 
     const provider = await getSignerOrProvider();
     //Get the balance
     const _treasuryBalance = await provider.getBalance(DAO_CONTRACT);
     //Set TreasuryBalance
     setTreasuryBalance(_treasuryBalance);
    
   } catch (err) {
    console.error(err);
   }
  }

  //console.log(proposals)
 //Get the proposals
 const getProposals = async()=> {
  try {
    //Get the provider
    const provider = await getSignerOrProvider();
    //Create an instance of the DAO contract
    const daoContract = new Contract(DAO_CONTRACT, DAO_ABI, provider);
    //Get the proposals
    const _proposals = await daoContract.getProposals();
    const _parsedProposals = _proposals.map(proposal => ({
    proposalId: proposal.proposalId.toString(),
    tokenAddress: proposal.tokenAdress.toString(),
    ethAmount: utils.formatEther(proposal.ethAmount),
    deadline: new Date(parseInt(proposal.deadline.toString())*1000),
    //YayVotes- the number of yayVotes for the proposal
    yayVotes: proposal.yayVotes.toString(),
    //NayVotes - the number of Nayvotes for the proposal
    nayVotes: proposal.nayVotes.toString(),
    ///the proposal status
    executed: proposal.executed.toString(),

  }))
    setproposals(_parsedProposals);
    
  } catch (err) {
   console.error(err);
  }
 }

  

  //State changing functions
  //Vote on proposal function

  const voteProposal = async(_index, _vote)=> {
    try {
    //Get the provider
    const signer = await getSignerOrProvider(true);
    //Create an instance of the DAO contract
    const daoContract = new Contract(DAO_CONTRACT, DAO_ABI, signer);
    //const _index = parseInt(currentProposalId);

    //Vote on the proposal
    const txn = await daoContract.voteProposal(_index, _vote);
    setLoading(true);
    await txn.wait();
    setLoading(false);
    await getProposals();
      
    } catch (err) {
      console.error(err);
    }
  }

  //Execute a proposal function
  const executeProposal = async(_index) => {
    try {
     //Get the provider
    const signer = await getSignerOrProvider(true);
    //Create an instance of the DAO contract
    const daoContract = new Contract(DAO_CONTRACT, DAO_ABI, signer);
    //const _index = parseInt(currentProposalId);
    //Execute the proposal
    const txn = await daoContract.executeProposal(_index);
    setLoading(true);
    await txn.wait();
    setLoading(false);
    await getProposals();
      
    } catch (err) {
      console.error(err);
    }
  }

  //create a proposal 
  const createProposal = async() => {
    try {
      //Get the provider
      const signer = await getSignerOrProvider(true);
      //Create an instance of the DAO contract
      const daoContract = new Contract(DAO_CONTRACT, DAO_ABI, signer);
      //Check the input value
      const _address = createFormData.tokenAddress;
      const _ethAmount = utils.parseEther(createFormData.ethAmount);
      if(utils.isAddress(_address)&&_ethAmount.gt(BigNumber.from(0))) {
        const txn = await daoContract.createProposal(_address, _ethAmount);
        setLoading(true);
        await txn.wait();
        setLoading(false);
        await getNumProposals();
        await getProposals();
      } else {
        window.alert("Inputs are invalid");
        throw new Error("Inputs are invalid");
      }        
      
    } catch (err) {
      console.error(err);
    }
  }
  console.log(currentProposalId);
  //Rendering function
  function handleChange(event) {
    setCreateFormData(prevFormData => {
      return {
        ...prevFormData,
        [event.target.name]: event.target.value
      }
    })
  }
  //Rendering the createTab
  function renderTab() {
    if(selectedTab ==="createproposal"){
      return(
        <div className={styles.form}>
            <br/>
            <br/>
          <p>Create a new proposal by following the form below. You need to fill in the token address and the amount of Eth that you want to propose. Remember the deadline for each proposal is 10 minutes after its creation.</p>
          <br/>            
              <label htmlFor='tokenAddress'>The token address you propose</label>
               
              <br/>
              <input
                  type="text"
                  placeholder="Token Address"
                  onChange={handleChange}
                  name="tokenAddress"
              />
                <br/>
              <label htmlFor='ethAmount'>The Eth amount the DAO is proposed to invest</label>
              <br/>
              <input
                  type="text"
                  placeholder="Eth amount"
                  onChange={handleChange}
                  name="ethAmount"
              />
              <button className={styles.button} onClick={createProposal}>
                {loading? "Loading..." : "Create the proposal"}
              </button>
          </div>
      )

    }

    if (selectedTab ==="viewproposal") {
      if(numProposal===0) {
        return (
        <div>
          <p>There are no proposals to display. You can create a new proposal by click "Create a proposal"</p>
        </div>)
      } else {
        const renderedProposal = proposals.map(proposal =>{
        const status = () => {
          if (proposal.executed ==="true") {
            return "Executed";
          } else {
            if (proposal.deadline.getTime() > Date.now()) {
              return "Active";
            } else {
              if(parseInt(proposal.yayVotes) > parseInt(proposal.nayVotes) ) {
                return "Passed";
              } else {
                return "Not passed";
              }
            }
          }
        }
        return (
        <div key ={proposal.proposalId} className={styles.proposal} onMouseOver={()=>setCurrentProposalId(proposal.proposalId)} >
          <div>
            <div>{status()}</div>
            <p>Proposal: {proposal.proposalId}</p>
            <div>The token adrress: {proposal.tokenAddress}</div>
            <div>The Eth amount:  {proposal.ethAmount} Eth</div>
            <div>The number of Yay votes: {proposal.yayVotes}</div>
            <div>The number of Nay votes: {proposal.nayVotes}</div>
            <div>The deadline of the proposal:{proposal.deadline.toLocaleString()} </div>
            {status()==="Active" && (<div>
              <button className={styles.subbutton} onClick={()=>{voteProposal(parseInt(proposal.proposalId),0)}}>
              Vote Yay
              </button>
              <button className={styles.subbutton} onClick={()=>{voteProposal(parseInt(proposal.proposalId),1)}}>
              Vote Nay 
              </button>
            </div>) } 
            {status()==="Passed" && (<div>
              <button className={styles.subbutton} onClick={()=>{executeProposal(parseInt(proposal.proposalId))}}>
              Execute
              </button>
             
            </div>) } 

          </div>

        </div>)})

        return renderedProposal;

      }
    }

    
    
  }


 

  //Handle the change of tabs
  function handleTab(event) {
   setSelectedTab(event.target.name);
  }


  return (
    <>
      <Head>
        <title>DAO management</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <section className={styles.main}>
        <div >
          <h1>Welcome to CryptoDAO, the future of finance !</h1>
          <div> Welcome to the DAO</div>
          <div className={styles.description}> 
          Your DAO membership NFT Balance: {nftBalance}
          <br/>
          Treasury Balance: {utils.formatEther(treasuryBalance)} ETH
          <br/>
          Total Number of Proposals {numProposal}            
          </div>
          <div className={styles.main_button}>
          <button className={styles.button}  onClick={handleTab} name="createproposal">
            Create a proposal
          </button>
          <button className={styles.button} onClick={handleTab} name="viewproposal">
            View a proposal
          </button>
          
        </div>
        <div className={styles.allproposals}>
          {renderTab()}
        </div>

        </div>
        <div>
          <img src="./2.svg"/>
        </div>

        

      </section>
      <footer className={styles.footer}>
        Made with &#10084; by HD
      </footer>      
    </>
  )
}
