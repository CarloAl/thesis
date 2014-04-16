var connection = new WebSocket('ws://127.0.0.1:8080');
        connection.onopen = function () {console.log("Websocket open");};
        connection.onmessage = matchFound;
        connection.onclose = function(event) {console.log(event);};
        
        function matchFound(e) {
            console.log(e);
            data = JSON.parse(e.data);
            string = 'Match Found! Call ' + data.username + ' at ' + data.phone;
            document.getElementById('response').innerHTML = string; 
        };

        function sendSocket(){
            console.log(document.getElementById('destination').value);
            connection.send(JSON.stringify({ 
                destination: document.getElementById('destination').value,
                passenger: document.getElementById('passenger').value,
                price: document.getElementById('price').value,
                radius: document.getElementById('radius').value,
                latitude: document.getElementById('latitude').value,
                longitude: document.getElementById('longitude').value,
                username: document.getElementById('username').value,
                taxi: document.getElementById('taxi').checked,
                phone: document.getElementById('number').value, 
                time: document.getElementById('time').value,
            }));

        }