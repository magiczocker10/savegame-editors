/* eslint-disable no-underscore-dangle */
/* globals
	checkbox, col, get, getField, getValue, label,
	SavegameEditor, select, setValue, span, tempFile
*/
/*
	PICROSS e for HTML5 Save Editor v20160704
	by Marc Robledo 2016
*/
let picrossData = [],
	pl,
	pt,
	version = 0;
function convertToBit( d ) {
	// eslint-disable-next-line no-bitwise
	return ( '00000000' + ( d >>> 0 ).toString( 2 ) ).slice( -8 ).split( '' ).reverse();
}
// eslint-disable-next-line no-implicit-globals, no-global-assign
SavegameEditor = {
	Name: 'PICROSS e',
	Filename: 'all.dat',
	Constants: {},
	_writeMedal: function ( e ) {
		const current = convertToBit( tempFile.readU8( Number( e.target.dataset.offset ) ) );
		current[ e.target.dataset.offset_ ] = e.target.checked ? '1' : '0';
		tempFile.writeU8(
			Number( e.target.dataset.offset ),
			parseInt( current.reverse().join( '' ), 2 )
		);
	},
	_writeSettings: function ( e ) {
		if ( e.target.type === 'checkbox' ) {
			tempFile.writeU8(
				Number( e.target.dataset.offset ),
				getField( e.target.dataset.id ).checked ? 1 : 0
			);
		} else {
			tempFile.writeU8(
				Number( e.target.dataset.offset ),
				getValue( e.target.dataset.id )
			);
		}
	},
	_writePuzzleTime: function ( e ) {
		if ( e.target.valueAsNumber > 86399000 ) {
			return;
		} // Filter invalid values
		tempFile.writeU32(
			Number( e.target.dataset.offset ),
			Math.floor( e.target.valueAsNumber / 1000 ) * 60
		);
	},

	/* check if savegame is valid */
	checkValidSavegame: function () {
		version = -1;
		switch ( tempFile.fileSize ) {
			case 740: // Picross e
				version = 0;
				break;
			case 1880: // Picross e2
				version = 1;
				break;
			case 828: // Picross e3
				version = 2;
				break;
			case 1436: // Picross e4
				version = 3;
				break;
			case 1688: // Picross e5
				version = 4;
				break;
			case 2228: // Picross e6
				version = 5;
				break;
			case 2328: // Picross e7 - e9
				version = 6;
				break;
			case 988: // Picross Club Nintendo Picross
				version = 7;
				break;
			case 920: // My Nintendo PICROSS
				version = 8;
				break;
		}
		return version > -1;
	},
	_generateList: function () {
		const offset = picrossData[ version ].modes_start || 0;
		for ( const difficulty of picrossData[ version ].modes ) {
			const c = pt.content.cloneNode( true );
			c.getElementById( 'puzzles-header' ).innerText = difficulty[ 2 ];
			c.getElementById( 'puzzles-header' ).id = '';
			c.getElementById( 'puzzles-placeholder' ).id = 'puzzles-' + difficulty[ 1 ];
			pl.append( c );
			const ce = get( 'puzzles-' + difficulty[ 1 ] );
			for ( let i = difficulty[ 3 ]; i < difficulty[ 4 ]; i++ ) {
				const date = new Date( 0 );
				date.setSeconds( Math.floor( tempFile.readU32( 4 * i + offset ) / 60 ) );
				const name = difficulty[ 0 ] + ( '0' + String( i - difficulty[ 3 ] + 1 ) ).slice( -2 ),
					timeEle = document.createElement( 'input' ),
					timeString = date.toISOString().slice( 11, 19 );
				timeEle.dataset.offset = 4 * i + offset;
				timeEle.max = '23:59:59';
				timeEle.min = '00:00:00';
				timeEle.step = '1';
				timeEle.type = 'time';
				timeEle.value = timeString;
				timeEle.addEventListener( 'change', SavegameEditor._writePuzzleTime );
				ce.append(
					col( 1, span( name ) ),
					col( 2, timeEle )
				);
				if ( picrossData[ version ].medals_offset ) {
					const box = checkbox( 'medal_' + name, '' ),
						tmp = Math.floor( i / 8 );
					box.addEventListener( 'change', SavegameEditor._writeMedal );
					box.checked = convertToBit( tempFile.readU8( box.dataset.offset ) )[ box.dataset.offset_ ] === '1' ? 'checked' : '';
					box.dataset.offset = Number( picrossData[ version ].medals_offset ) + tmp;
					box.dataset.offset_ = i - tmp * 8;
					ce.append( col( 1, box ) );
				} else {
					ce.append( col( 1, span( '' ) ) );
				}
				if ( i % 3 === 2 ) {
					ce.append( col( 1, span( '' ) ) );
				}
			}
		}
		const settingsEle = document.getElementById( 'settings' ),
			sOffset = picrossData[ version ].settings_offset;
		for ( const setting in sOffset ) {
			const settingData = sOffset[ setting ];
			if ( settingData[ 0 ] === 'checkbox' ) {
				const checkboxEle = checkbox( 'settings-' + setting, 'checked' );
				checkboxEle.dataset.id = 'settings-' + setting;
				checkboxEle.dataset.offset = settingData[ 3 ];
				settingsEle.append(
					col( 8, label( 'checkbox-settings-' + setting, settingData[ 1 ] ) ),
					col( 4, checkboxEle )
				);
				checkboxEle.addEventListener( 'change', SavegameEditor._writeSettings );
				getField( 'checkbox-settings-' + setting ).checked = tempFile.readU8( Number( settingData[ 3 ] ) ) > 0;
			} else if ( settingData[ 0 ] === 'select' ) {
				const selectEle = select( 'settings-' + setting, picrossData[ version ][ settingData[ 2 ] ], SavegameEditor._writeSettings );
				selectEle.dataset.id = 'settings-' + setting;
				selectEle.dataset.offset = settingData[ 3 ];
				settingsEle.append(
					col( 8, span( settingData[ 1 ] ) ),
					col( 4, selectEle )
				);
				setValue( 'settings-' + setting, tempFile.readU8( Number( settingData[ 3 ] ) ) );
			}
		}

		const unlockableContent = picrossData[ version ].unlockables || [],
			unlockablesEle = document.getElementById( 'unlockables' );
		for ( let index = 0; index < unlockableContent.length; index++ ) {
			const checkboxEle_ = checkbox( 'unlockable-' + index, '' );
			unlockablesEle.append(
				col( 8, label( 'checkbox-unlockable-' + index, unlockableContent[ index ][ 0 ] ) ),
				col( 4, checkboxEle_ )
			);
			checkboxEle_.addEventListener( 'change', SavegameEditor._writeSettings );
			checkboxEle_.checked = tempFile.readU8( Number( unlockableContent[ index ][ 1 ] ) ) === 1 ? 'checked' : '';
			checkboxEle_.dataset.id = 'unlockable-' + index;
			checkboxEle_.dataset.offset = unlockableContent[ index ][ 1 ];
		}
	},
	preload: function () {
		pl = get( 'puzzle-list' );
		pt = get( 'picross-template' );
		pl.innerHTML = '';
		fetch( '/savegame-editors/picross-e/versions.json' )
			.then( ( response ) => response.json() ).then( ( data ) => {
				picrossData = data;
			} ).catch( ( error ) => {
				// eslint-disable-next-line no-console
				console.log( '[%cPicross Save Editor%c]', 'color:orange', 'color:inherit', error );
			} );
	},

	/* load function */
	load: function () {
		tempFile.fileName = 'all.dat';
		tempFile.littleEndian = true;

		setTimeout( SavegameEditor._generateList, 300 );
	},

	/* save function */
	save: function () {
	}
};
