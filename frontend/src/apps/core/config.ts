export const CONFIG = {
	API_URL: window.location.origin+'/api/v1',
	DB_NAME: "db_aggre",
	STORE_NAMES: [
		'settings',
		'trn_sync_queue'
	],
	SYNC_BATCH_SIZE: 20,
	STATUS: {
		PENDING: 'PENDING',
		SYNCED: 'SYNCED'
	}
};