import superagent from 'superagent';
import base64 from 'base-64';

const createWooCommerceAuthProvider = ( name, baseUrl, consumerKey, consumerSecret ) => {
	const boot = () => {
		if ( ! consumerKey || ! consumerSecret ) {
			return Promise.reject();
		}

		return Promise.resolve();
	};

	const login = () => {
		if ( ! consumerKey || ! consumerSecret ) {
			return Promise.reject( 'WooCommerce consumer key or secret is not set' );
		}

		return Promise.resolve();
	};

	const request = ( { method, url, body } ) => {
		const req = superagent( method, url )
			.set( 'accept', 'application/json' );

		if ( body && Object.keys( body ).length > 0 ) {
			req.send( body );
		}

		req.set( 'Authorization', 'Basic ' + base64.encode( consumerKey + ':' + consumerSecret ) );

		return new Promise( resolve =>
			req.end( ( err, response = {} ) => {
				resolve( {
					status: response.status,
					body: response.body,
					error: err,
				} );
			} )
		);
	};

	const logout = () => {};

	return {
		boot, login, logout, request,
	};
};

export default createWooCommerceAuthProvider;
