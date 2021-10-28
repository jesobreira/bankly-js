'use strict';

const qs = require('qs')
const uuidv4 = require('uuid').v4

if (typeof fetch === 'undefined')
	var fetch = require('node-fetch')

const API_ENDPOINT = 'https://api.bankly.com.br'
const LOGIN_ENDPOINT = 'https://login.bankly.com.br'

const API_ENDPOINT_STAGING = 'https://api.sandbox.bankly.com.br'
const LOGIN_ENDPOINT_STAGING = 'https://login.sandbox.bankly.com.br'

const getBankList = () =>
	fetch(API_ENDPOINT + '/banklist').then(res => res.json())

class BankAccount {
	constructor({ bankCode = 332, branch, account, document, name }) {
		return arguments[0]
	}
}

class Bankly {
	constructor(client_id, client_secret, env = 'prod') {
		this.client_id = client_id;
		this.client_secret = client_secret;
		this.token_expiry = 0;
		this.token = null;
		this.env = env
		this.debug = () => {}
	}

	_getHost() {
		return this.env === 'prod' ?
			API_ENDPOINT :
			API_ENDPOINT_STAGING
	}

	_getAuthHost() {
		return this.env === 'prod' ?
			LOGIN_ENDPOINT :
			LOGIN_ENDPOINT_STAGING
	}

	async _get(endpoint, variables = false, headers = {}) {
		if (Math.floor(new Date().getTime()/1000) > this.token_expiry) {
			this.debug("Token has expired")
			await this._doAuth()
		}

		let init = {
			method: 'GET',
			headers: {
				"Authorization": this.token ? "Bearer "+this.token : undefined,
				"X-Correlation-ID": uuidv4(),
				"API-Version": "1.0",
				...headers
			}
		}
		return fetch(this._getHost() + endpoint + '?' + qs.stringify(variables), init)
			.then(res => res.json())
	}

	async _getRAW(endpoint, variables = false) {
		if (Math.floor(new Date().getTime()/1000) > this.token_expiry) {
			this.debug("Token has expired")
      await this._doAuth()
		}
    

		let init = {
			method: 'GET',
			headers: {
        "Authorization": this.token ? "Bearer "+this.token : undefined,
				"X-Correlation-ID": uuidv4(),
				"API-Version": "1.0"
			}
		}
    const data = fetch(this._getHost() + endpoint + '?' + qs.stringify(variables), init).then(res => { 
      return res  
     });

		return data
	}

	async _post(endpoint, variables = false, headers = {}) {
		if (Math.floor(new Date().getTime()/1000) > this.token_expiry) {
			this.debug("Token has expired")
			await this._doAuth()
		}

		let init = {
			method: 'POST',
			headers: variables ? {
				"Content-Type": "application/x-www-form-urlencoded",
				"Authorization": this.token ? "Bearer "+this.token : undefined,
				"X-Correlation-ID": uuidv4(),
				"API-Version": "1.0",
				...headers
			} : (headers || undefined),
			body: variables ? qs.stringify(variables) : null
		}
		return fetch(this._getHost() + endpoint, init)
			.then(res => res.json())
	}

	async _postJSON(endpoint, variables = false, headers = {}) {
		if (Math.floor(new Date().getTime()/1000) > this.token_expiry) {
			this.debug("Token has expired")
			await this._doAuth()
		}

		let init = {
			method: 'POST',
			headers: variables ? {
				"Content-Type": "application/json",
				"Authorization": this.token ? "Bearer "+this.token : undefined,
				"X-Correlation-ID": uuidv4(),
				"API-Version": "1.0",
				...headers
			} : (headers || undefined),
			body: variables ? JSON.stringify(variables) : null
		}
		return fetch(this._getHost() + endpoint, init)
			.then(res => res.json())
	}

	async _putJSON(endpoint, variables = false) {
		if (Math.floor(new Date().getTime()/1000) > this.token_expiry) {
			this.debug("Token has expired")
			await this._doAuth()
		}

		let init = {
			method: 'PUT',
			headers: variables ? {
				"Content-Type": "application/json",
				"Authorization": this.token ? "Bearer "+this.token : undefined,
				"X-Correlation-ID": uuidv4(),
				"API-Version": "1.0"
			} : undefined,
			body: variables ? JSON.stringify(variables) : null
		}

		return fetch(this._getHost() + endpoint, init)
			.then(res => res.json())
	}

	async _deleteJSON(endpoint, variables = false) {
		if (Math.floor(new Date().getTime()/1000) > this.token_expiry) {
			this.debug("Token has expired")
			await this._doAuth()
		}

		let init = {
			method: 'DELETE',
			headers: variables ? {
				"Content-Type": "application/json",
				"Authorization": this.token ? "Bearer "+this.token : undefined,
				"X-Correlation-ID": uuidv4(),
				"API-Version": "1.0"
			} : undefined,
			body: variables ? JSON.stringify(variables) : null
		}

		return fetch(this._getHost() + endpoint, init)
		.then(res => res.json())
	}

	async _deleteRawNV(endpoint) {
        if (Math.floor(new Date().getTime() / 1000) > this.token_expiry) {
            this.debug('Token has expired');
            await this._doAuth();
        }
        const init = {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                Authorization: this.token ? `Bearer ${this.token}` : undefined,
                'X-Correlation-ID': uuidv4(),
                'API-Version': '1.0',
            }
        };
        return fetch(this._getHost() + endpoint, init)
            .then((res) => res);
    }

	_doAuth() {
		this.debug("Will perform auth")
		let init = {
			method: 'POST',
			headers: {
				"Content-Type": "application/x-www-form-urlencoded"
			},
			body: qs.stringify({
				grant_type: 'client_credentials',
				client_id: this.client_id,
				client_secret: this.client_secret
			}) 
		}
		return fetch(this._getAuthHost() + '/connect/token', init)
			.then(res => res.json())
			.then(res => {
				this.debug("Access token retrieved")
				this.token = res.access_token

				// save next token expiration
				// with a 60 seconds security offset
				this.token_expiry = Math.floor(new Date().getTime()/1000) + res.expires_in - 60
			})
	}

	getBalance(branch, account) {
		return this._get('/account/balance', { branch, account })
	}

	getStatement(branch, account, offset, limit, details = true, detailsLevelBasic = true) {
		return this._get('/account/statement', { branch, account, offset, limit, details, detailsLevelBasic })
	}

	getEvents(Branch, Account, Page, Pagesize, IncludeDetails = true) {
		return this._get('/events', { Branch, Account, Page, Pagesize, IncludeDetails })
	}

	transfer(amount, description, sender, recipient) {
		if (sender.bankCode)
			delete sender.bankCode

		return this._postJSON('/fund-transfers', { amount, description, sender, recipient })
	}

	getTransferStatus(branch, account, AuthenticationId) {
		return this._get('/fund-transfers/' + AuthenticationId + '/status', { branch, account })
	}

	get bankList() {
		return getBankList()
	}

	static get bankList() {
		return getBankList()	
	}

	// boletos
	validateBoleto(code) {
		return this._postJSON('/bill-payment/validate', { code })
	}

	getCarriers() {
		return this._get('')
	}
}

module.exports = Bankly
module.exports.BankAccount = BankAccount
