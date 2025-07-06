/* eslint-disable no-bitwise, no-underscore-dangle */
/* globals
	col, get, getField, getValue, SavegameEditor, select, setNumericRange, setValue, span, tempFile
*/
/*
	The Lego Movie Videogame for HTML5 Save Editor v20160704
	by Marc Robledo 2016
*/
function convertToBit( d, l ) {
	return ( '0000000000000000' + ( d >>> 0 ).toString( 2 ) ).slice( 0 - l ).split( '' );
}
// eslint-disable-next-line no-implicit-globals, no-global-assign
SavegameEditor = {
	Name: 'The Lego Movie Videogame',
	Filename: 'savegame.dat',

	/* Constants */
	Constants: {
		BLUE_STONES_OFFSET: 0x228, // 552
		CHALLENGE_OFFSET: 0x8,
		CHARACTER_OFFSET: 0x47C, // 1148
		CHARACTER_OPTIONS: [
			{ value: 0, name: 'Locked' },
			{ value: 1, name: 'Unlocked' },
			{ value: 2, name: 'Unlocked+Bought' }
		],
		// eslint-disable-next-line max-len
		SETTINGS_MUSIC_MICROPHONE_OFFSET: 0x18, // 00=All OFF, A0=Music ON, 0A=Microphone ON, AA=All ON
		LANGUAGE_OFFSET: 0x19,
		LANGUAGES: [
			{ value: 1, name: 'English' },
			{ value: 2, name: 'French' },
			{ value: 3, name: 'Italian' },
			{ value: 4, name: 'German' },
			{ value: 5, name: 'Spanish' },
			{ value: 6, name: 'Dutch' },
			{ value: 7, name: 'Danish' }
		],
		LEVEL_LAST_PLAYED_OFFSET: 0x6, // 6
		LEVEL_LAST_PLAYED_OFFSET2: 0x454, // 1108
		PROFILES: [
			{ value: 1, name: 'Save slot 1', offset: 0x1c }, // 28
			{ value: 2, name: 'Save slot 2', offset: 0x4fc } // 1276
		],
		PROFILE_SELECTION_OFFSET: 0x1A,
		SECTION_UNLOCK_OFFSET: 0x4A4, // 1188
		SECTION_UNLOCK_STATUS: [
			{ value: 0, name: 'Locked, Locked, Locked' },
			{ value: 1, name: 'Unlocked - Locked - Locked' },
			{ value: 21, name: 'Played - Unlocked - Locked' },
			{ value: 341, name: 'Played - Played - Unlocked' },
			{ value: 1911, name: 'Played - Played - Played' }
		],
		UPGRADES_OFFSET: 0x475, // 1141
		YELLOW_STONE_OFFSET: 0x238 // 568
	},
	/* CRC32 - from Alex - https://stackoverflow.com/a/18639999 */
	/* Combined with CRC32-Version by Slattz (https://github.com/Slattz/POTC3D_Rehash) */
	CRC32_TABLE: ( function () {
		let c;
		const crcTable = [];
		for ( let n = 0; n < 256; n++ ) {
			c = n;
			for ( let k = 0; k < 8; k++ ) {
				c = ( ( c & 1 ) ? ( 0xedb88320 ^ ( c >>> 1 ) ) : ( c >>> 1 ) );
			}
			crcTable[ n ] = ( c >>> 0 );
		}
		return crcTable;
	}() ),
	crc32: function ( file, len, offset ) {
		const data = file.readBytes( offset, len - offset );
		let byte = 0b0,
			checksum = 0xFF;
		for ( let i = 0; i < data.length; i++ ) {
			[ byte ] = new Int8Array( [ data[ i ] ] );
			const [ cs_ ] = new Int8Array( [ checksum ] );
			byte ^= cs_;
			byte &= 0xff;
			const cs___ = ( i === 0 ? cs_ : checksum );
			const a = SavegameEditor.CRC32_TABLE[ byte ];
			checksum = a ^ ( cs___ >>> 8 );
		}
		return ( ( checksum >>> 0 ) << 0 );
	},
	_getProfileOffset: function () {
		return this.Constants.PROFILES[ Number( getValue( 'profile-selector' ) ) - 1 ].offset;
	},
	_getSectionStatus: function ( s ) {
		const amount = Math.ceil( 1.5 * s ),
			offset = SavegameEditor._getProfileOffset() +
			SavegameEditor.Constants.SECTION_UNLOCK_OFFSET;
		let result = '';
		for ( let i = 0; i < amount; i++ ) {
			result = convertToBit( tempFile.readU8( offset + i ), 8 ).join( '' ) + result;
		}
		result = result.slice( 0, result.length - 12 * ( s - 1 ) ).slice( -12 );
		return parseInt( result, 2 );
	},
	_writeSectionStatus: function ( e ) {
		const offset = SavegameEditor._getProfileOffset() +
				SavegameEditor.Constants.SECTION_UNLOCK_OFFSET,
			s = e.target.dataset.section,
			status = getValue( 'section-status-' + s ),
			toWrite = [],
			amount = Math.ceil( 1.5 * s );
		let result = '';
		for ( let i = 0; i < amount; i++ ) {
			result = convertToBit( tempFile.readU8( offset + i ), 8 ).join( '' ) + result;
		}
		result = result.slice( 0, result.length - 12 * ( s ) ) +
			convertToBit( status, 12 ).join( '' ) +
			result.slice( result.length - 12 * ( s - 1 ), result.length );
		for ( let j = 0; j < result.length; j += 8 ) {
			toWrite.unshift( result.slice( j, j + 8 ) );
		}
		for ( let k = 0; k < toWrite.length; k++ ) {
			tempFile.writeU8(
				offset + k,
				parseInt( toWrite[ k ], 2 )
			);
		}
	},
	_writeLanguage: function () {
		tempFile.writeU8(
			SavegameEditor.Constants.LANGUAGE_OFFSET,
			getValue( 'language' )
		);
	},
	_getLevelStoneOffset: function () {
		const profileStartOffset = SavegameEditor._getProfileOffset();
		return profileStartOffset + SavegameEditor.Constants.YELLOW_STONE_OFFSET + Number( getValue( 'levels' ) ) * 8;
	},
	_writeLevelStones: function () {
		tempFile.writeU24(
			SavegameEditor._getLevelStoneOffset(),
			getValue( 'level-stones' )
		);
	},
	_writeBlueStones: function () {
		const profileStartOffset = SavegameEditor._getProfileOffset();
		tempFile.writeU24(
			profileStartOffset + SavegameEditor.Constants.BLUE_STONES_OFFSET,
			getValue( 'blue-stones' )
		);
	},
	_writeSoundSettings: function () {
		tempFile.writeU8(
			SavegameEditor.Constants.SETTINGS_MUSIC_MICROPHONE_OFFSET,
			( getField( 'checkbox-microphone' ).checked ? 10 : 0 ) + ( getField( 'checkbox-music' ).checked ? 160 : 0 )
		);
	},
	_writeLastPlayed: function () {
		tempFile.writeU8(
			SavegameEditor.Constants.LEVEL_LAST_PLAYED_OFFSET,
			getValue( 'last-played' )
		);
		tempFile.writeU8(
			SavegameEditor.Constants.LEVEL_LAST_PLAYED_OFFSET2,
			getValue( 'last-played' )
		);
	},
	_writeCharacter: function ( e ) {
		const profileStartOffset = SavegameEditor._getProfileOffset(),
			offset = profileStartOffset +
				SavegameEditor.Constants.CHARACTER_OFFSET +
				Number( e.target.dataset.offset ),
			bits = convertToBit( tempFile.readU8( offset ), 8 ),
			val = getValue( e.target.id );
		bits[ e.target.dataset.offset_ * 2 ] = ( val === '2' ? '1' : '0' );
		bits[ e.target.dataset.offset_ * 2 + 1 ] = ( val !== '0' ? '1' : '0' );
		tempFile.writeU8(
			offset,
			parseInt( bits.join( '' ), 2 )
		);
	},
	_writeChallenge: function ( e ) {
		const lvl = Number( getValue( 'levels' ) );
		tempFile.writeU8(
			SavegameEditor._getProfileOffset() +
			SavegameEditor.Constants.CHALLENGE_OFFSET + ( lvl ) * 10 +
			Number( e.target.dataset.challenge ),
			e.target.checked === true ? '1' : '0'
		);
	},
	_writeUpgrade: function ( e ) {
		const offset = SavegameEditor._getProfileOffset() +
				SavegameEditor.Constants.UPGRADES_OFFSET,
			bitsUnlocked = convertToBit( tempFile.readU16( offset ), 16 ),
			bitsBought = convertToBit( tempFile.readU16( offset + 2 ), 16 ),
			val = getValue( e.target.id );
		bitsBought[ e.target.dataset.offset ] = ( val === '2' ? '1' : '0' );
		bitsUnlocked[ e.target.dataset.offset ] = ( val !== '0' ? '1' : '0' );
		tempFile.writeU16(
			offset,
			parseInt( bitsUnlocked.join( '' ), 2 )
		);
		tempFile.writeU16(
			offset + 2,
			parseInt( bitsBought.join( '' ), 2 )
		);
	},
	_loadLevel: function () {
		const lvl = Number( getValue( 'levels' ) ),
			profileStartOffset = SavegameEditor._getProfileOffset();
		setValue( 'level-stones', tempFile.readU24( SavegameEditor._getLevelStoneOffset() ) );
		for ( let i = 0; i < 10; i++ ) {
			getField( 'challenge-' + ( i + 1 ) + '-unlocked' ).checked = tempFile.readU8( profileStartOffset + SavegameEditor.Constants.CHALLENGE_OFFSET + ( lvl - 1 ) * 10 + i ) === 1;
		}
	},
	_loadProfile: function () {
		const profileStartOffset = SavegameEditor._getProfileOffset();

		setValue( 'blue-stones', tempFile.readU24( profileStartOffset + SavegameEditor.Constants.BLUE_STONES_OFFSET ) );
		setValue( 'levels', '1' );
		let field, a, b, c;
		for ( c = 0; c < SavegameEditor.Constants.CHARACTERS.length; c++ ) {
			field = getField( 'select-character-' + c );
			a = convertToBit(
				tempFile.readU8(
					profileStartOffset +
					SavegameEditor.Constants.CHARACTER_OFFSET +
					Number( field.dataset.offset )
				), 8
			);
			b = ( a[ field.dataset.offset_ * 2 ] === '1' ) ? '2' : ( ( a[ field.dataset.offset_ * 2 + 1 ] === '1' ) ? '1' : '0' );
			setValue( 'character-' + c, Number( b ) );
		}
		const bought = convertToBit(
				tempFile.readU16(
					profileStartOffset +
					SavegameEditor.Constants.UPGRADES_OFFSET +
					2
				), 16
			),
			unlocked = convertToBit(
				tempFile.readU16(
					profileStartOffset +
					SavegameEditor.Constants.UPGRADES_OFFSET
				), 16
			);
		for ( c = 0; c < SavegameEditor.Constants.UPGRADES.length; c++ ) {
			field = getField( 'select-upgrade-' + c );
			b = ( bought[ field.dataset.offset ] === '1' ) ? '2' : ( ( unlocked[ field.dataset.offset ] === '1' ) ? '1' : '0' );
			setValue( 'upgrade-' + c, Number( b ) );
		}
		setValue( 'last-played', tempFile.readU8( profileStartOffset + SavegameEditor.Constants.LEVEL_LAST_PLAYED_OFFSET ) );
		SavegameEditor._loadLevel();
		for ( let l = 1; l < 16; l++ ) {
			setValue( 'section-status-' + l, SavegameEditor._getSectionStatus( l ) );
		}
	},

	/* check if savegame is valid */
	checkValidSavegame: function () {
		return ( tempFile.fileSize === 2524 );
	},

	preload: function () {
		get( 'toolbar' ).children[ 0 ].appendChild( select( 'profile-selector', this.Constants.PROFILES, this._loadProfile ) );
		get( 'container-language' ).appendChild( select( 'language', SavegameEditor.Constants.LANGUAGES, SavegameEditor._writeLanguage ) );
		get( 'container-levelselection' ).appendChild( select( 'levels', SavegameEditor.Constants.LEVELS, SavegameEditor._loadLevel ) );
		for ( let i = 0; i < 10; i++ ) {
			getField( 'challenge-' + ( i + 1 ) + '-unlocked' ).addEventListener( 'change', SavegameEditor._writeChallenge );
		}
		get( 'container-last-played' ).appendChild( select( 'last-played', SavegameEditor.Constants.LEVELS, SavegameEditor._writeLastPlayed ) );
		get( 'input-level-stones' ).addEventListener( 'change', SavegameEditor._writeLevelStones );
		get( 'input-blue-stones' ).addEventListener( 'change', SavegameEditor._writeBlueStones );
		getField( 'checkbox-microphone' ).addEventListener( 'change', SavegameEditor._writeSoundSettings );
		getField( 'checkbox-music' ).addEventListener( 'change', SavegameEditor._writeSoundSettings );
		setNumericRange( 'blue-stones', 0, 16777215 );
		const tmp1 = get( 'character-list' );
		for ( let j = 0; j < SavegameEditor.Constants.CHARACTERS.length; j++ ) {
			tmp1.appendChild( col( 2, span( SavegameEditor.Constants.CHARACTERS[ j ] ) ) );
			const sel = select( 'character-' + j, SavegameEditor.Constants.CHARACTER_OPTIONS, SavegameEditor._writeCharacter );
			sel.dataset.offset = Math.floor( j * 0.25 );
			sel.dataset.offset_ = 3 - ( j - sel.dataset.offset * 4 );
			tmp1.appendChild( col( 4, sel ) );
		}
		const tmp2 = get( 'upgrades-list' );
		for ( let k = 0; k < SavegameEditor.Constants.UPGRADES.length; k++ ) {
			tmp2.appendChild( col( 2, span( SavegameEditor.Constants.UPGRADES[ k ] ) ) );
			const sel_ = select( 'upgrade-' + k, SavegameEditor.Constants.CHARACTER_OPTIONS, SavegameEditor._writeUpgrade );
			sel_.dataset.offset = k;
			tmp2.appendChild( col( 4, sel_ ) );
		}
		const tmp3 = get( 'sections-list' );
		for ( let l = 1; l < 16; l++ ) {
			const sel__ = select( 'section-status-' + l, SavegameEditor.Constants.SECTION_UNLOCK_STATUS, SavegameEditor._writeSectionStatus );
			sel__.dataset.section = l;
			tmp3.append(
				col( 2, span( 'S' + l + ' (Level ' + ( ( l - 1 ) * 3 + 1 ) + '-' + ( l * 3 ) + ')' ) ),
				col( 4, sel__ )
			);
		}
	},

	/* load function */
	load: function () {
		tempFile.fileName = 'savegame.dat';
		tempFile.littleEndian = true;
		// eslint-disable-next-line no-console
		console.log( '[%cThe Lego Movie Videogame%c]', 'color:orange', 'color:inherit', 'Old CRC32 ', tempFile.readU32( 0 ) );
		// eslint-disable-next-line no-console
		console.log( '[%cThe Lego Movie Videogame%c]', 'color:orange', 'color:inherit', 'Calced CRC32 ', SavegameEditor.crc32( tempFile, tempFile.fileSize, 24 ) );
		setValue( 'language', tempFile.readU8( SavegameEditor.Constants.LANGUAGE_OFFSET ) );
		setValue( 'savegame', 'Save game #' + ( tempFile.readU8( SavegameEditor.Constants.PROFILE_SELECTION_OFFSET ) + 1 ) );
		getField( 'checkbox-microphone' ).checked = tempFile.readU8( SavegameEditor.Constants.SETTINGS_MUSIC_MICROPHONE_OFFSET ) > 0;
		getField( 'checkbox-music' ).checked = tempFile.readU8( SavegameEditor.Constants.SETTINGS_MUSIC_MICROPHONE_OFFSET ) > 100;
		this._loadProfile();
	},

	/* save function */
	save: function () {
		// eslint-disable-next-line no-console
		console.log( '[%cThe Lego Movie Videogame%c]', 'color:orange', 'color:inherit', 'New CRC32 ', SavegameEditor.crc32( tempFile, tempFile.fileSize, 24 ) );
		tempFile.writeU32(
			0,
			SavegameEditor.crc32( tempFile, tempFile.fileSize, 24 )
		);
	}
};
