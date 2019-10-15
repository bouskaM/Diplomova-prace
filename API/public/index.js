
ReactDOM.render(<App />, document.getElementById('app'))
function App() {
    const handleScrape = () => {
        console.log('button was clicked');
        fetch('/clicked', { method: 'POST' })
            .then(function (response) {
                if (response.ok) {
                    console.log('Click was recorded');
                    return;
                }
                throw new Error('Request failed.');
            })
            .catch(function (error) {
                console.log(error);
            });
    }
    return (
        <div className="container">
            <div className="row">
                <div className="text-center col-12"><h1>Diplomová práce</h1></div>
                <button onClick={handleScrape}>Test me</button>
            </div>
        </div>
    );
}


