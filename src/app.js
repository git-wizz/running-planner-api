var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var bodyParser = require('body-parser');
var multer = require('multer');

var app = express();
var db = new sqlite3.Database('runsDB');
var upload = multer();


var path = require('path');
var dbPath = path.resolve(__dirname, 'runsDB');
console.log('Database path:', dbPath);

var db = new sqlite3.Database(dbPath, (err) => {
	if (err) {
		console.error('Error connecting to the database:', err);
	} else {
		console.log('Connected to SQLite database.');
	}
});

// Middleware
app.use(bodyParser.json());
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

db.serialize(() => {
	db.all("SELECT * FROM runs", [], (err, rows) => {
		if (err) {
			console.error('Database error:', err.message);
		} else {
			console.log('Sample data:', rows);
		}
	});
});

//tests
app.get('/good', function(req, res){
	res.send('The world is a better place with you in it');
});

app.get('/bad', function(req, res){
	res.send('Life is as good as you make it to be');
});


// Routes

// Home Route
app.get('/', function (req, res) {
    res.send('Welcome to the Running Planner and Tracker API.');
});

// Get all runs
/**
 * @api {get} /runs Get all runs
 * @apiGroup Runs
 * @apiDescription Fetch all runs stored in the database.
 * @apiSuccess {Object[]} runs List of all runs.
 * @apiSuccess {Number} runs.id Unique ID of the run.
 * @apiSuccess {String} runs.date Date of the run.
 * @apiSuccess {Number} runs.distance Distance covered (in kilometers).
 * @apiSuccess {String} runs.pace Average pace of the run.
 * @apiSuccess {String} runs.notes Additional notes about the run.
 * @apiExample {curl} Example usage:
 *     curl -X GET http://localhost:3000/runs
 */
app.get('/runs', function(req, res) {
    db.all("SELECT * FROM runs", function(err, rows) {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve runs.' });
        } else {
            res.jsonp(rows);
        }
    });
});

// Get a specific run by ID
/**
 * @api {get} /runs/:id Get a specific run
 * @apiGroup Runs
 * @apiDescription Fetch a specific run by its unique ID.
 * @apiParam {Number} id Unique ID of the run.
 * @apiSuccess {Number} id Unique ID of the run.
 * @apiSuccess {String} date Date of the run.
 * @apiSuccess {Number} distance Distance covered.
 * @apiSuccess {String} pace Average pace of the run.
 * @apiSuccess {String} notes Additional notes about the run.
 * @apiExample {curl} Example usage:
 *     curl -X GET http://localhost:3000/runs/1
 */
app.get('/runs/:id', function (req, res) {
    let id = req.params.id;
    db.get('SELECT * FROM runs WHERE id = ?', [id], function(err, row) {
        if (err) {
            res.status(500).jsonp({ error: 'Failed to retrieve the run.' });
        } else if (!row) {
            res.status(404).json({ error: 'Run not found.' });
        } else {
            res.jsonp(row);
        }
    });
});

// Add a new run
/**
 * @api {post} /runs Add a new run
 * @apiGroup Runs
 * @apiDescription Add a new run to the database.
 * @apiBody {String} date The date of the run.
 * @apiBody {Number} distance The distance covered (in kilometers).
 * @apiBody {String} pace The average pace of the run.
 * @apiBody {String} notes Additional notes about the run (optional).
 * @apiSuccess {Number} id Unique ID of the created run.
 * @apiSuccess {String} date Date of the run.
 * @apiSuccess {Number} distance Distance covered.
 * @apiSuccess {String} pace Average pace.
 * @apiSuccess {String} notes Notes about the run.
 * @apiExample {curl} Example usage:
 *     curl -X POST http://localhost:3000/runs \
 *          -H "Content-Type: application/json" \
 *          -d '{"date":"2023-12-01","distance":5.0,"pace":"6:30","notes":"Morning jog"}'
 */
app.post('/runs', upload.array(), function (req, res, next) {

	let id = req.params.id;
	let { date, distance, pace, notes } = req.body;
	
	if (!date || !distance || !pace) {
		return res.status(400).json({ error: 'Date, distance, and pace are required. ' });
	}

    db.run(
        'INSERT INTO runs (date, distance, pace, notes) VALUES (?, ?, ?, ?)',
        [date, distance, pace, notes],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Failed to add the run.' });
            } else {
                res.status(201).json({ id: this.lastID, date, distance, pace, notes });
            }
        });
});

// Update a run
/**
 * @api {put} /runs/:id Update a run
 * @apiGroup Runs
 * @apiDescription Update an existing run's details.
 * @apiParam {Number} id Unique ID of the run to update.
 * @apiBody {String} date The updated date of the run.
 * @apiBody {Number} distance The updated distance covered (in kilometers).
 * @apiBody {String} pace The updated average pace.
 * @apiBody {String} notes Updated notes about the run (optional).
 * @apiSuccess {Number} id Unique ID of the updated run.
 * @apiSuccess {String} date Updated date of the run.
 * @apiSuccess {Number} distance Updated distance covered.
 * @apiSuccess {String} pace Updated average pace.
 * @apiSuccess {String} notes Updated notes.
 * @apiExample {curl} Example usage:
 *     curl -X PUT http://localhost:3000/runs/1 \
 *          -H "Content-Type: application/json" \
 *          -d '{"date":"2023-12-02","distance":10.0,"pace":"7:00","notes":"Evening jog"}'
 */
app.put('/runs/:id', upload.array(), function(req, res, next) {
	
	let id = req.params.id;
	let { date, distance, pace, notes } = req.body;
	
	if (!date || !distance || !pace) {
		return res.status(400).json({ error: 'Date, distance, and pace are required. ' });
	}

    db.run(
        'UPDATE runs SET date = ?, distance = ?, pace = ?, notes = ? WHERE id = ?',
        [date, distance, pace, notes, id],
        function (err) {
            if (err) {
                res.status(500).json({ error: 'Failed to update the run.' });
            } else if (this.changes === 0) {
                res.status(404).json({ error: 'Run not found.' });
            } else {
                res.json({ id, date, distance, pace, notes });
            }
        });
});

// Delete a run
/**
 * @api {delete} /runs/:id Delete a run
 * @apiGroup Runs
 * @apiDescription Delete a specific run from the database.
 * @apiParam {Number} id Unique ID of the run to delete.
 * @apiSuccessExample Success-Response:
 *     HTTP/1.1 204 No Content
 * @apiExample {curl} Example usage:
 *     curl -X DELETE http://localhost:3000/runs/1
 */
app.delete('/runs/:id', function (req, res) {
    let id = req.params.id;
    db.run('DELETE FROM runs WHERE id = ?', [id], 
	function (err) {
        if (err) {
            res.status(500).json({ error: 'Failed to delete the run.' });
        } else if (this.changes === 0) {
            res.status(404).json({ error: 'Run not found.' });
        } else {
            res.status(204).send();
        }
    });
});

//Additional endpoints

//Get runs by specific dates
/**
 * @api {get} /runs/date/:date Get runs by date
 * @apiGroup Runs
 * @apiDescription Fetch all runs that occurred on a specific date.
 * @apiParam {String} date Date to filter runs by (format: YYYY-MM-DD).
 * @apiSuccess {Object[]} runs List of runs on the specified date.
 * @apiExample {curl} Example usage:
 *     curl -X GET http://localhost:3000/runs/date/2023-12-01
 */
app.get('/runs/date/:date', function (req, res) {
    let date = req.params.date;
    db.all('SELECT * FROM runs WHERE date = ?', [date], function (err, rows) {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve runs.' });
        } else if (rows.length === 0) {
            res.status(404).json({ error: 'No runs found for the specified date.' });
        } else {
            res.json(rows);
        }
    });
});

//Get runs with distance greater than a value
/**
 * @api {get} /runs/distance/greater/:distance Get runs with distance greater than a value
 * @apiGroup Runs
 * @apiDescription Fetch all runs where the distance is greater than a specified value.
 * @apiParam {Number} distance Minimum distance (in kilometers) to filter runs by.
 * @apiSuccess {Object[]} runs List of runs meeting the distance criteria.
 * @apiExample {curl} Example usage:
 *     curl -X GET http://localhost:3000/runs/distance/greater/10
 */
app.get('/runs/distance/greater/:distance', function (req, res) {
    let distance = parseFloat(req.params.distance);
    db.all('SELECT * FROM runs WHERE distance > ?', [distance], function (err, rows) {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve runs.' });
        } else if (rows.length === 0) {
            res.status(404).json({ error: 'No runs found with distance greater than the specified value.' });
        } else {
            res.json(rows);
        }
    });
});

//Get runs with distance below a specific value
/**
 * @api {get} /runs/distance/lesser/:distance Get runs with lesser distance
 * @apiGroup Runs
 * @apiDescription Fetch all runs where the distance is less than a specified value.
 * @apiParam {Number} distance Maximum distance (in kilometers) to filter runs by.
 * @apiSuccess {Object[]} runs List of runs meeting the distance criteria.
 * @apiSuccess {Number} runs.id Unique ID of the run.
 * @apiSuccess {String} runs.date Date of the run.
 * @apiSuccess {Number} runs.distance Distance covered.
 * @apiSuccess {String} runs.pace Average pace.
 * @apiSuccess {String} runs.notes Additional notes about the run.
 * @apiExample {curl} Example usage:
 *     curl -X GET http://localhost:3000/runs/distance/lesser/5
 */

app.get('/runs/distance/lesser/:distance', function (req, res) {
    let distance = parseFloat(req.params.distance);
    db.all('SELECT * FROM runs WHERE distance < ?', [distance], function (err, rows) {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve runs.' });
        } else if (rows.length === 0) {
            res.status(404).json({ error: 'No runs found with distance lesser than the specified value.' });
        } else {
            res.json(rows);
        }
    });
});


//Get runs with faster pace
/**
 * @api {get} /runs/pace/faster/:pace Get runs with faster pace
 * @apiGroup Runs
 * @apiDescription Fetch all runs where the pace is faster than a specified value.
 * @apiParam {String} pace Maximum pace (format: MM:SS) to filter runs by.
 * @apiSuccess {Object[]} runs List of runs meeting the pace criteria.
 * @apiExample {curl} Example usage:
 *     curl -X GET http://localhost:3000/runs/pace/faster/06:30
 */
app.get('/runs/pace/faster/:pace', function (req, res) {
    let pace = req.params.pace; // Example: '06:30'
    db.all('SELECT * FROM runs WHERE pace < ?', [pace], function (err, rows) {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve runs.' });
        } else if (rows.length === 0) {
            res.status(404).json({ error: 'No runs found with a faster pace than the specified value.' });
        } else {
            res.json(rows);
        }
    });
});

//Get runs with slower pace
/**
 * @api {get} /runs/pace/slower/:pace Get runs with slower pace
 * @apiGroup Runs
 * @apiDescription Fetch all runs where the pace is slower than a specified value.
 * @apiParam {String} pace Minimum pace (format: MM:SS) to filter runs by.
 * @apiSuccess {Object[]} runs List of runs meeting the pace criteria.
 * @apiSuccess {Number} runs.id Unique ID of the run.
 * @apiSuccess {String} runs.date Date of the run.
 * @apiSuccess {Number} runs.distance Distance covered.
 * @apiSuccess {String} runs.pace Average pace.
 * @apiSuccess {String} runs.notes Additional notes about the run.
 * @apiExample {curl} Example usage:
 *     curl -X GET http://localhost:3000/runs/pace/slower/07:30
 */

app.get('/runs/pace/slower/:pace', function (req, res) {
    let pace = req.params.pace; // Example: '07:30'
    db.all('SELECT * FROM runs WHERE pace > ?', [pace], function (err, rows) {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve runs.' });
        } else if (rows.length === 0) {
            res.status(404).json({ error: 'No runs found with a slower pace than the specified value.' });
        } else {
            res.json(rows);
        }
    });
});

//Get runs by a specific keyword in notes
/**
 * @api {get} /runs/notes/:keyword Get runs by keyword in notes
 * @apiGroup Runs
 * @apiDescription Fetch all runs where the `notes` field contains a specific keyword.
 * @apiParam {String} keyword Keyword to search for in notes.
 * @apiSuccess {Object[]} runs List of runs where the notes contain the keyword.
 * @apiExample {curl} Example usage:
 *     curl -X GET http://localhost:3000/runs/notes/morning
 */
app.get('/runs/notes/:keyword', function (req, res) {
    let keyword = `%${req.params.keyword}%`;
    db.all('SELECT * FROM runs WHERE notes LIKE ?', [keyword], function (err, rows) {
        if (err) {
            res.status(500).json({ error: 'Failed to retrieve runs.' });
        } else if (rows.length === 0) {
            res.status(404).json({ error: 'No runs found with the specified keyword in notes.' });
        } else {
            res.json(rows);
        }
    });
});



//dummy test
app.get('/test', function (req, res) {
	db.all('SELECT * FROM runs', function (err, rows) {
		if (err) {
		    console.error('Test query failed:', err.message);
		    res.status(500).json({ error: 'Database test query failed.' });
		} else {
			console.log('Test query result:', rows);
		    res.json(rows);
		}
    });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});