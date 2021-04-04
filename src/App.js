/*global chrome*/

function App() {
  const onClick = () => {
    console.log("clicked");
    chrome.runtime.sendMessage("Hello from the popup!");
  };

  return (
    <div>
      <p>Hello World</p>
    </div>
  );
}

export default App;
