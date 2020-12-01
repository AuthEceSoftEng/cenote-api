const { Pool } = require("pg");

// Cockroach client object
const client = new Pool({
	user: "cockroach",
	host: process.env.COCKROACH_URL,
	database: process.env.COCKROACH_DBNAME || "cenote",
	port: process.env.COCKROACH_PORT || 26257,
});

// Connect to cockroach
client.connect((err) => err && console.error(err));

// Delete tables
const tablesToDelete = new Set();
const deletePromises = [];
const selectQuery = "SELECT * from information_schema.columns WHERE table_schema='public'";
client.query(selectQuery)
	.then(({ rows: answer }) => {
		answer.filter((el) => el.table_name.startsWith("deleted_")).forEach((prop) => {
			tablesToDelete.add(prop.table_name);
		});
		// Issue delete commands
		const setIterator = tablesToDelete.values();
		for (let i = 0; i < tablesToDelete.size; i += 1) {
			const table = setIterator.next().value;
			const dropTableQuery = `DROP TABLE IF EXISTS ${table}`;
			deletePromises.push(client.query(dropTableQuery)
				.then(() => {
					console.log(`Deleted table ${table}`);
				}));
		}
		// Wait until all deletions have finished
		Promise.all(deletePromises)
			.then(() => {
				console.log("Cleanup completed");
				process.exit();
			});
	})
	.catch((error) => {
		console.log(`Cleanup failed: ${error.message}`);
		process.exit();
	});
