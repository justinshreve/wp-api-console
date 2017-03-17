export const guessEndpointDocumentation = ( method, namespace, computedPath ) => {
	// Try to guess some info about the endpoints
	let group = '';
	let groupPlural = '';
	let groupSingular = '';
	let description = '';

	computedPath = computedPath || '/';

	const verbMatch = computedPath.match( /^\/([\w-]*)(\/|$)/ );

	if ( verbMatch ) {
		groupPlural = group = verbMatch[ 1 ];

		if ( computedPath === '/' ) {
			group = 'auto-discovery';
		} else {
			groupSingular = groupPlural.replace( /ies$/, 'y' ).replace( /s$/, '' );
		}

		function getDescription() {
			if ( group === 'auto-discovery' ) {
				if ( computedPath === '/' ) {
					return 'List endpoints in the ' + namespace + ' namespace';
				} else {
					return 'List endpoints in the ' + namespace + ' namespace (site-specific)';
				}
			}

			if ( namespace === 'wp/v2' ) {
				if ( /\$(id|status|taxonomy|type)$/.test( computedPath ) ) {
					switch ( method ) {
						case 'GET':
							return 'Get a ' + groupSingular;
						case 'POST':
						case 'PUT':
						case 'PATCH':
							return 'Edit a ' + groupSingular;
						case 'DELETE':
							return 'Delete a ' + groupSingular;
						default:
							return '';
					}
				} else {
					switch ( method ) {
						case 'GET':
							return 'List ' + groupPlural;
						case 'POST':
							return 'Create a ' + groupSingular;
						default:
							return '';
					}
				}
			}

			return '';
		}

		description = getDescription() || '';
	}

	return {
		group,
		description,
	};
};

export const parseEndpoints = data => {
	const endpoints = [];

	Object.keys( data.routes ).forEach( url => {
		const route = data.routes[ url ];
		// Drop the /wc/v2
		const rawpath = data.namespace ? url.substr( data.namespace.length + 1 ) : url;
		route.endpoints.forEach( rawEndpoint => {
			rawEndpoint.methods.forEach( method => {
				// Parsing Arguments
				const args = Object.keys( rawEndpoint.args ).reduce( ( memo, key ) => {
					const { description = '', type = 'string' } = rawEndpoint.args[ key ];
					return {
						...memo,
						[ key ]: { type, description },
					};
				}, {} );

				// Parsing path
				const path = {};
				const paramRegex = /\([^()]*\)/g;
				const parameters = rawpath.match( paramRegex ) || [];
				let pathLabel = rawpath;
				let pathFormat = rawpath;
				parameters.forEach( param => {
					console.log(param);
					const paramDetailsRegex = /[^<]*<([^>]*)>[^]*\[([^\]]*)][^]*/;
					const explodedParameter = param.match( paramDetailsRegex );

					const paramName = '$' + explodedParameter[ 1 ];
					path[ paramName ] = {
						description: '',
						type: explodedParameter[ 2 ],
					};
					pathLabel = pathLabel.replace( param, paramName );
					pathFormat = pathFormat.replace( param, '%s' );
				} );

				const { group, description } = guessEndpointDocumentation( method, data.namespace, pathLabel );

				const request = { path };
				if ( method === 'GET' || method === 'DELETE' ) {
					request.query = args;
				} else {
					request.body = args;
				}

				const endpoint = {
					pathFormat: pathFormat || '/',
					pathLabeled: pathLabel || '/',
					request,
					description,
					group,
					method,
				};

				endpoints.push( endpoint );
			} );
		} );
	} );

	return endpoints;
};

const createApi = ( authProvider, name, url, namespaces = [ 'wc/v2' ] ) => {
	return {
		getDiscoveryUrl: version => `${ url }${ version }?context=help`,
		loadVersions: () => new Promise( resolve => resolve( { versions: namespaces } ) ),
		buildRequest: ( version, method, path, body ) => {
			return {
				url: url + version + path,
				apiNamespace: version,
				method,
				path,
				body,
			};
		},
		baseUrl: url,
		authProvider,
		name,
		parseEndpoints,
	};
};

export default createApi;
