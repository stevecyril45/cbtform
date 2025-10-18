import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import Web3 from 'web3';
import detectEthereumProvider from '@metamask/detect-provider';
import { DeviceService } from '../client/device.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class Web3Service {
  private web3: Web3 | undefined;
  private account: string | null = null;
  accounts: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private readonly MAINNET_CHAIN_ID = '0x1'; // Mainnet Chain ID
  private readonly SEPOLIA_CHAIN_ID = '0x' + (11155111).toString(16); // Sepolia Chain ID
  private readonly targetChainId: string = environment.production ? this.MAINNET_CHAIN_ID : this.SEPOLIA_CHAIN_ID;

  constructor(private ds: DeviceService) {}

  async initWeb3(): Promise<boolean> {
    this.ds.showSpinner();
    const provider: any = await detectEthereumProvider();
    if (provider) {
      this.web3 = new Web3(provider);
      // const isCorrectNetwork = await this.checkAndSwitchNetwork();
      // if (!isCorrectNetwork) {
      //   this.ds.oErrorNotification(
      //     'Wrong Network',
      //     `Please switch to ${environment.production ? 'Ethereum Mainnet' : 'Sepolia testnet'} in MetaMask.`
      //   );
      //   return false;
      // }
      await this.loadAccount();
      provider.on('accountsChanged', async (accounts: string[]) => {
        console.log('Accounts changed:', accounts);
        this.account = accounts[0] || null;
        this.accounts.next(accounts);
      });
      provider.on('chainChanged', async (chainId: string) => {
        console.log('Chain changed:', chainId);
        if (chainId !== this.targetChainId) {
          this.ds.oErrorNotification(
            'Network Changed',
            `Please switch back to ${environment.production ? 'Ethereum Mainnet' : 'Sepolia testnet'}.`
          );
          this.account = null;
          this.accounts.next([]);
          await this.checkAndSwitchNetwork();
        } else {
          await this.loadAccount();
        }
      });
      this.ds.hideSpinner()

      return true;
    } else {
      this.ds.hideSpinner();
      console.error('Please install MetaMask!');
      this.ds.oErrorNotification('No ERC Wallet', 'No ERC Wallet installed. Please install MetaMask to use this application.');
      return false;
    }
  }

  private async checkAndSwitchNetwork(): Promise<boolean> {
    if (!this.web3) return false;

    try {
      const chainId = await this.web3.eth.getChainId();
      if (chainId.toString(16) === this.targetChainId.slice(2)) {
        return true;
      }

      // Attempt to switch network
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: this.targetChainId }],
        });
        return true;
      } catch (switchError: any) {
        // If network is not added, add it
        if (switchError.code === 4902) {
          const networkConfig = environment.production
            ? {
                chainId: this.MAINNET_CHAIN_ID,
                chainName: 'Ethereum Mainnet',
                rpcUrls: ['https://mainnet.infura.io/v3/'+environment.infurakey], // Replace with your Infura key or use public RPC
                nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://etherscan.io'],
              }
            : {
                chainId: this.SEPOLIA_CHAIN_ID,
                chainName: 'Ethereum Sepolia',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
                blockExplorerUrls: ['https://sepolia.etherscan.io'],
              };

          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [networkConfig],
          });
          return true;
        }
        console.error(`Failed to switch to ${environment.production ? 'Mainnet' : 'Sepolia'}:`, switchError);
        return false;
      }
    } catch (error) {
      console.error('Error checking network:', error);
      return false;
    }
  }

  private async loadAccount() {
    this.ds.showSpinner();
    const accounts = await this.web3?.eth.getAccounts();
    this.ds.hideSpinner();
    console.log('Loaded accounts:', accounts);
    this.account = accounts && accounts.length > 0 ? accounts[0] : null;
    this.accounts.next(accounts || []);
  }

  public async connectAccount(): Promise<string | null> {
    this.ds.showSpinner();
    if (!this.web3) {
      const initialized = await this.initWeb3();
      this.ds.hideSpinner();
      if (!initialized) return null;
    }

    try {
      this.ds.showSpinner();
      const accounts = await this.web3?.eth.requestAccounts();
      this.ds.hideSpinner();
      if (accounts) {
        this.accounts.next(accounts);
      }
      this.account = accounts && accounts.length > 0 ? accounts[0] : null;
      return this.account;
    } catch (error: any) {
      console.error('Error connecting to MetaMask:', error);
      this.ds.oErrorNotification(`Error ${error.code}`, error.message);
      return null;
    }
  }

  public async sendPayment(toAddress: string, amountInEth: string): Promise<string | null> {
    if (!this.web3 || !this.account) {
      console.error('Web3 or account not initialized');
      this.ds.oErrorNotification('Payment Error', 'Please connect your wallet first.');
      return null;
    }
    this.ds.showSpinner();
    // Verify correct network
    const chainId = await this.web3.eth.getChainId();
    this.ds.hideSpinner();
    if (chainId.toString(16) !== this.targetChainId.slice(2)) {
      this.ds.oErrorNotification(
        'Wrong Network',
        `Please switch to ${environment.production ? 'Ethereum Mainnet' : 'Sepolia testnet'} in MetaMask.`
      );
      return null;
    }

    if (!this.web3.utils.isAddress(toAddress)) {
      console.error('Invalid Ethereum address:', toAddress);
      this.ds.oErrorNotification('Invalid Address', 'The provided wallet address is invalid.');
      return null;
    }

    try {
      this.ds.showSpinner();
      const amountInWei = this.web3.utils.toWei(amountInEth, 'ether');
      const tx = {
        from: this.account,
        to: toAddress,
        value: amountInWei,
        gas: 21000, // Standard gas limit for ETH transfer
      };

      const txReceipt = await this.web3.eth.sendTransaction(tx);
      console.log('Transaction sent:', txReceipt);
    this.ds.hideSpinner();
      return txReceipt.transactionHash; // Return transaction hash
    } catch (error: any) {
      console.error('Payment failed:', error);
      this.ds.oErrorNotification(`Payment Error ${error.code || ''}`, error.message || 'Failed to send transaction.');
      return null;
    }
  }

  public getAccount(): string | null {
    return this.account;
  }

  public getWeb3(): Web3 | undefined {
    return this.web3;
  }

  public getNetworkName(): string {
    return environment.production ? 'Ethereum Mainnet' : 'Sepolia Testnet';
  }
}
