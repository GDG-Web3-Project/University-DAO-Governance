"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import { apiFetch, getStoredToken, removeToken, saveToken } from '@/lib/api';

interface ClassInfo { id: string; name: string; slug: string; isPublic: boolean; }
interface User { id: string; name: string; email: string; walletAddress?: string | null; role: 'student' | 'worker' | 'admin'; class: ClassInfo | null; }
interface Proposal { id: string; title: string; description: string; state: string; forVotes: number; againstVotes: number; scope: 'class' | 'public'; className: string; author: string; startAt: number; endAt: number; hasVoted: boolean; canVote?: boolean; invitedOnly?: boolean; }

interface DAOContextType {
  user: User | null; isAuthenticated: boolean; walletConnected: boolean; isConnected: boolean; account: string | null;
  provider: ethers.BrowserProvider | null; signer: ethers.Signer | null; tokenContract: ethers.Contract | null; governorContract: ethers.Contract | null; timelockContract: ethers.Contract | null; classElectionContract: ethers.Contract | null;
  balance: string; votingPower: string; proposals: Proposal[]; classElections: Proposal[];
  connectWallet: () => Promise<void>; disconnectWallet: () => void;
  login: (email: string, password: string) => Promise<void>; register: (name: string, email: string, password: string, inviteCode?: string) => Promise<void>; logout: () => void;
  loadProposals: () => Promise<Proposal[]>; loadProposal: (id: string) => Promise<Proposal | null>; loadClassElections: () => Promise<Proposal[]>;
  createProposal: (input: { target: string; amount: string; description: string }) => Promise<void>;
  createClassElection: (input: { title: string; description: string; endAt: number; invitedWallets: string[] }) => Promise<void>;
  castVote: (proposalId: string, choice: 'for' | 'against') => Promise<void>; voteClassElection: (proposalId: string, choice: 'for' | 'against') => Promise<void>;
}

const DAOContext = createContext<DAOContextType | undefined>(undefined);
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_TOKEN_ADDRESS || '';
const GOVERNOR_ADDRESS = process.env.NEXT_PUBLIC_GOVERNOR_ADDRESS || '';
const TIMELOCK_ADDRESS = process.env.NEXT_PUBLIC_TIMELOCK_ADDRESS || '';
const CLASS_ELECTION_ADDRESS = process.env.NEXT_PUBLIC_CLASS_ELECTION_ADDRESS || '';
const BASE_SEPOLIA_CHAIN_ID = Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || 84532);
const LOCAL_CHAIN_ID = Number(process.env.NEXT_PUBLIC_LOCAL_CHAIN_ID || 31337);
const ENABLE_LOCAL_DEMO_CHAIN = process.env.NEXT_PUBLIC_ENABLE_LOCAL_DEMO_CHAIN === 'true';
const TOKEN_ABI = ['function balanceOf(address) view returns (uint256)', 'function getVotes(address) view returns (uint256)'];
const GOVERNOR_ABI = ['function propose(address[] targets, uint256[] values, bytes[] calldatas, string description) returns (uint256)', 'function castVote(uint256 proposalId, uint8 support) returns (uint256)', 'function state(uint256 proposalId) view returns (uint8)', 'function proposalDeadline(uint256 proposalId) view returns (uint256)', 'function proposalVotes(uint256 proposalId) view returns (uint256 againstVotes, uint256 forVotes, uint256 abstainVotes)', 'event ProposalCreated(uint256 proposalId, address proposer, address[] targets, uint256[] values, bytes[] calldatas, uint256 startBlock, uint256 endBlock, string description)'];
const TIMELOCK_ABI = ['function admin() view returns (address)'];
const CLASS_ELECTION_ABI = ['function createClassElection(bytes32 classId, string title, string descriptionHash, uint64 startTime, uint64 endTime, address[] invitedWallets) returns (uint256)', 'function vote(uint256 electionId, bool support)', 'function getElectionResult(uint256 electionId) view returns (uint256 forVotes, uint256 againstVotes, bool finalized)'];

export const DAOProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [tokenContract, setTokenContract] = useState<ethers.Contract | null>(null);
  const [governorContract, setGovernorContract] = useState<ethers.Contract | null>(null);
  const [timelockContract, setTimelockContract] = useState<ethers.Contract | null>(null);
  const [classElectionContract, setClassElectionContract] = useState<ethers.Contract | null>(null);
  const [balance, setBalance] = useState('0');
  const [votingPower, setVotingPower] = useState('0');
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [classElections, setClassElections] = useState<Proposal[]>([]);
  const isAuthenticated = Boolean(user);
  const walletConnected = Boolean(account);
  const isConnected = Boolean(user || account);
  const getProposalStateString = (state: number): string => ['Pending', 'Active', 'Canceled', 'Defeated', 'Succeeded', 'Queued', 'Expired', 'Executed'][state] || 'Unknown';
  const loadUserData = async (token: ethers.Contract, address: string) => {
    try { const [bal, votes] = await Promise.all([token.balanceOf(address), token.getVotes(address)]); setBalance(ethers.formatEther(bal)); setVotingPower(ethers.formatEther(votes)); } catch { setBalance('0'); setVotingPower('0'); }
  };

  const loadSession = useCallback(async () => {
    if (!getStoredToken()) return setUser(null);
    try { const response = await apiFetch('/api/auth/me'); setUser(response.user); } catch { removeToken(); setUser(null); }
  }, []);

  const loadProposals = useCallback(async () => {
    if (!governorContract) return [];
    try {
      const providerFromContract = governorContract.runner?.provider as ethers.BrowserProvider | undefined;
      if (!providerFromContract) return [];
      const currentBlock = await providerFromContract.getBlockNumber();
      const events = await governorContract.queryFilter('ProposalCreated', Math.max(0, currentBlock - 100000));
      const mapped: Proposal[] = [];
      for (const event of events) {
        const eventLog = event as ethers.EventLog;
        if (!eventLog.args) continue;
        const proposalId = eventLog.args[0] as bigint;
        const description = eventLog.args[7] as string;
        const state = await governorContract.state(proposalId);
        const deadline = await governorContract.proposalDeadline(proposalId);
        const votes = await governorContract.proposalVotes(proposalId);
        mapped.push({ id: proposalId.toString(), title: description.split(':')[0] || 'Public Proposal', description, state: getProposalStateString(state), forVotes: parseFloat(ethers.formatEther(votes[1] ?? BigInt(0))), againstVotes: parseFloat(ethers.formatEther(votes[0] ?? BigInt(0))), scope: 'public', className: 'Student Union', author: eventLog.args[1] as string, startAt: Date.now(), endAt: Date.now() + Math.max(Number(deadline) - currentBlock, 0) * 12000, hasVoted: false });
      }
      setProposals(mapped);
      return mapped;
    } catch { return []; }
  }, [governorContract]);

  const loadClassElections = useCallback(async () => {
    try {
      const requestOptions = account ? { headers: { 'x-wallet-address': account } } : {};
      const response = await apiFetch('/api/class-elections', requestOptions);
      const mapped: Proposal[] = (response.elections || []).map((election: any) => ({ id: election.id, title: election.title, description: election.description, state: election.state, forVotes: election.forVotes, againstVotes: election.againstVotes, scope: 'class', className: election.className, author: 'Class Admin', startAt: election.startAt, endAt: election.endAt, hasVoted: false, canVote: election.canVote, invitedOnly: true }));
      setClassElections(mapped);
      return mapped;
    } catch { return []; }
  }, [account]);

  const loadProposal = async (id: string) => {
    const loaded = [...(await loadProposals()), ...(await loadClassElections())];
    return loaded.find((proposal) => proposal.id === id) || null;
  };

  const login = async (email: string, password: string) => { const response = await apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); saveToken(response.token); setUser(response.user); };
  const register = async (name: string, email: string, password: string, inviteCode?: string) => { const response = await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password, inviteCode }) }); saveToken(response.token); setUser(response.user); };

  const logout = () => {
    removeToken();
    setUser(null);
    setProposals([]);
    setClassElections([]);
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setSigner(null);
    setTokenContract(null);
    setGovernorContract(null);
    setTimelockContract(null);
    setClassElectionContract(null);
    setBalance('0');
    setVotingPower('0');
    setProposals([]);
    setClassElections([]);
  };

  const isSupportedChain = (chainId: number) => chainId === BASE_SEPOLIA_CHAIN_ID || (ENABLE_LOCAL_DEMO_CHAIN && chainId === LOCAL_CHAIN_ID);
  const ensureSupportedNetwork = async (ethereum: any) => {
    let providerFromWallet = new ethers.BrowserProvider(ethereum);
    let network = await providerFromWallet.getNetwork();
    if (isSupportedChain(Number(network.chainId))) return providerFromWallet;
    const baseHex = `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`;
    try {
      await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: baseHex }] });
    } catch {
      if (ENABLE_LOCAL_DEMO_CHAIN) {
        const localHex = `0x${LOCAL_CHAIN_ID.toString(16)}`;
        await ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: localHex }] });
      } else {
        throw new Error(`Please switch your wallet network to Base Sepolia (${BASE_SEPOLIA_CHAIN_ID}).`);
      }
    }
    providerFromWallet = new ethers.BrowserProvider(ethereum);
    network = await providerFromWallet.getNetwork();
    if (!isSupportedChain(Number(network.chainId))) throw new Error('Unsupported network');
    return providerFromWallet;
  };

  const connectWallet = async () => {
    const ethereum = (window as any).ethereum;
    if (!ethereum) throw new Error('Please install MetaMask or another Ethereum wallet.');
    try {
      await ethereum.request({ method: 'eth_requestAccounts' });
      const web3Provider = await ensureSupportedNetwork(ethereum);
      const web3Signer = await web3Provider.getSigner();
      const address = await web3Signer.getAddress();

      const token = TOKEN_ADDRESS ? new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, web3Signer) : null;
      const governor = GOVERNOR_ADDRESS ? new ethers.Contract(GOVERNOR_ADDRESS, GOVERNOR_ABI, web3Signer) : null;
      const timelock = TIMELOCK_ADDRESS ? new ethers.Contract(TIMELOCK_ADDRESS, TIMELOCK_ABI, web3Signer) : null;
      const classElection = CLASS_ELECTION_ADDRESS ? new ethers.Contract(CLASS_ELECTION_ADDRESS, CLASS_ELECTION_ABI, web3Signer) : null;

      setProvider(web3Provider);
      setSigner(web3Signer);
      setAccount(address);
      setTokenContract(token);
      setGovernorContract(governor);
      setTimelockContract(timelock);
      setClassElectionContract(classElection);
      if (token) await loadUserData(token, address);
      if (getStoredToken()) { try { await apiFetch('/api/auth/wallet', { method: 'POST', body: JSON.stringify({ walletAddress: address }) }); } catch {} }
      await Promise.all([governor ? loadProposals() : Promise.resolve([]), loadClassElections()]);
    } catch (error) { throw error; }
  };

  const createClassElection = async (input: { title: string; description: string; endAt: number; invitedWallets: string[] }) => {
    if (!classElectionContract || !user?.class) throw new Error('Class election contract is not connected.');
    const start = Math.floor(Date.now() / 1000);
    const end = Math.floor(input.endAt / 1000);
    const classId = ethers.keccak256(ethers.toUtf8Bytes(user.class.slug));
    const descHash = `ipfs://${ethers.keccak256(ethers.toUtf8Bytes(input.description))}`;
    const tx = await classElectionContract.createClassElection(classId, input.title, descHash, start, end, input.invitedWallets);
    const receipt = await tx.wait();
    await apiFetch('/api/class-elections', { method: 'POST', body: JSON.stringify({ title: input.title, description: input.description, classId: user.class.id, startAt: start * 1000, endAt: end * 1000, invitedWallets: input.invitedWallets, contractElectionId: 0, txHash: receipt?.hash || '' }) });
    await loadClassElections();
  };

  const voteClassElection = async (proposalId: string, choice: 'for' | 'against') => {
    if (!classElectionContract) throw new Error('Class election contract is not connected.');
    const tx = await classElectionContract.vote(BigInt(proposalId), choice === 'for');
    await tx.wait();
    await loadClassElections();
  };

  const createProposal = async (input: { target: string; amount: string; description: string }) => {
    if (!governorContract) throw new Error('Governor contract is not connected.');
    const targets = [input.target];
    const values = [ethers.parseEther(input.amount)];
    const calldatas = ['0x'];
    const tx = await governorContract.propose(targets, values, calldatas, `PUBLIC:${input.description}`);
    await tx.wait();
    await loadProposals();
  };

  const castVote = async (proposalId: string, choice: 'for' | 'against') => {
    if (!governorContract) throw new Error('Governor contract is not connected.');
    const tx = await governorContract.castVote(BigInt(proposalId), choice === 'for' ? 1 : 0);
    await tx.wait();
    await loadProposals();
  };

  useEffect(() => { loadSession(); }, [loadSession]);
  useEffect(() => { if (account && tokenContract) loadUserData(tokenContract, account); }, [account, tokenContract]);

  return (
    <DAOContext.Provider value={{ user, isAuthenticated, walletConnected, isConnected, account, provider, signer, tokenContract, governorContract, timelockContract, classElectionContract, balance, votingPower, proposals, classElections, connectWallet, disconnectWallet, login, register, logout, loadProposals, loadProposal, loadClassElections, createProposal, createClassElection, castVote, voteClassElection }}>
      {children}
    </DAOContext.Provider>
  );
};

export const useDAO = (): DAOContextType => {
  const context = useContext(DAOContext);
  if (!context) throw new Error('useDAO must be used within a DAOProvider');
  return context;
};