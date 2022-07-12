import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Unity, useUnityContext } from "react-unity-webgl";
import { web3Enable, web3Accounts, web3FromAddress } from '@talismn/extension-dapp'
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';

import './App.css'

function App() {

  const { unityProvider, sendMessage, isLoaded, addEventListener, removeEventListener } = useUnityContext({
    loaderUrl: "/assets/TheParaverse.loader.js",
    dataUrl: "/assets/TheParaverse.data",
    frameworkUrl: "/assets/TheParaverse.framework.js",
    codeUrl: "/assets/TheParaverse.wasm",
  });

  function handleWalletAddress() {
    sendMessage('Player', 'SetWalletAddressText', accountsConnected[0].address)
  }


  const [selectedExtension, setSelectedExtesion] = useState([]);
  const [accountsConnected, setAccountsConnected] = useState([]);
  const [message, setMessage] = useState("");

  const transactionComplete = () => {
    sendMessage('Button', 'setKebabButtonState', "false")
    sendMessage('SpawnThanks', 'SpawnKheopsNow')
    setMessage("");
  }

  const transactionFailed = () => {
    sendMessage('Button', 'setKebabButtonState', "false")
    setMessage("");
  }


  const injectedExtensions = async () => {
    // await web3InWindow()
    let selectedExtension = await web3Enable('The Paraverse', 'talisman')
    setSelectedExtesion(selectedExtension)

    let accounts = []
    selectedExtension ? accounts = await web3Accounts() : console.log("No Accounts Found")
    setAccountsConnected(accounts)
    console.log(accounts)
  }

  const sendKebabMoney = useCallback(async (id) => {

    const wsProvider = new WsProvider('wss://kusama-rpc.polkadot.io/');
    const api = await ApiPromise.create({ provider: wsProvider });

    const SENDER = id;
    const injector = await web3FromAddress(SENDER);

    api.tx.balances
      .transfer("Drz4y4uG7mZ54WgP2pPCQuC5rnXY9fEcJoesLFSuBRzNAgC", 123)
      .signAndSend(SENDER, { signer: injector.signer }, ({ status, events }) => {
        if (status.isInBlock || status.isFinalized) {
          events
            // find/filter for failed events
            .filter(({ event }) =>
              api.events.system.ExtrinsicFailed.is(event)
            )
            // we know that data for system.ExtrinsicFailed is
            // (DispatchError, DispatchInfo)
            .forEach(({ event: { data: [error, info] } }) => {
              if (error.isModule) {
                // for module errors, we have the section indexed, lookup
                const decoded = api.registry.findMetaError(error.asModule);
                const { docs, method, section } = decoded;

                console.log(`${section}.${method}: ${docs.join(' ')}`);
              } else {
                // Other, CannotLookup, BadOrigin, no extra info
                console.log(error.toString());
              }
            });
        }
      }).then(() => {
        setMessage("Transaction Sent")
      }).catch(err => {
        setMessage("Transaction Failed")
      });
  }, []);

  useEffect(() => {
    console.log(isLoaded)
    injectedExtensions();
    if(isLoaded){
      handleWalletAddress();
    }
  }, [isLoaded])

  useEffect(() => {

    addEventListener("BuyKebab", sendKebabMoney)
    return () => {
      removeEventListener("BuyKebab", sendKebabMoney)
    }
  }, [addEventListener, removeEventListener, sendKebabMoney])

  useEffect(() => {
    if(message !== ""){
      if(message === "Transaction Sent"){
        transactionComplete()
      }
      if(message === "Transaction Failed"){
        transactionFailed()
      }

    }
  }, [message])

  return (
    <div className="App">
      <h3>Kheops Kebabverse 🥙</h3>
      {
        accountsConnected.length === 0 ? <p>Connect an Account</p> : (
          <Unity className='UnityGame' unityProvider={unityProvider} />
        )
      }
    </div>

  ) 
}

export default App;
