// https://gist.github.com/bitpshr/076b164843f0414077164fe7fe3278d9
// use the whole thing here preferably
window.addEventListener('load', function() {
  console.log('...');
  if (window.ethereum) {
    window.web3 = new Web3(ethereum);
    ethereum.enable();
  }

  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/votes/1', true);
  xhr.addEventListener("load", function() {
    document.getElementById("comments").innerHTML = xhr.responseText;
  });
  xhr.send();
});

function signVote(preference) {
  let domainType = [
    { name: "name", type: "string" },
    { name: "version", type: "string" },
  ];
  let voteType = [
    { name: "campaignId", type: "uint256" },
    { name: "preference", type: "string" },
  ];

  let domainData = {
    name: "0x V0x",
    version: "1"
  };
  var voteData = {
    campaignId: "1",
    preference: preference,
  };
  let zdata = JSON.stringify({
    types: {
      EIP712Domain: domainType,
      Vote: voteType,
    },
    domain: domainData,
    primaryType: "Vote",
    message: voteData
  });

  signer = web3.eth.coinbase
  console.log(zdata, signer, preference);

  return new Promise(function(resolve, reject) {
    function done(error, result) {
      if (error) { console.error(error); reject(error); }
      else { console.log(result); resolve(result.result); }
    }
    web3.currentProvider.sendAsync({
      method: "eth_signTypedData_v3",
      params: [signer, zdata],
      from: signer
    }, done)
  })
}

function vote(preference) {
  signVote(preference).then(function(sig) {
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/vote', true);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({
      preference: preference,
      voterAddress: web3.eth.coinbase,
      signature: sig,
      comment: document.getElementById("comment").value,
      campaignId: 1}));
  });
}
