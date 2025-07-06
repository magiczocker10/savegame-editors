/* eslint-disable max-len, es-x/no-string-prototype-replaceall, no-underscore-dangle */
/* globals col, get, getValue, inputNumber, SavegameEditor, select, setNumericRange, setValue, span, tempFile */
/* eslint-disable no-multi-spaces */
/*
	Nintendogs + Cats for HTML5 Save Editor v20160704
	by Marc Robledo 2016
*/

const diffs = [ 1056964607, 12582913, 6291456, 4194304 ],
	levelBorders = [],
	reg = /\d+/;
for ( let i = 0; i < 30; i++ ) {
	diffs.push( diffs[ diffs.length - 2 ] * 0.5 );
}
let value = 0;
for ( let j = 0; j < 34; j++ ) {
	let amount = 1;
	if ( j > 3 && j % 2 === 1 ) {
		amount = Math.pow( 2, ( j - 1 ) * 0.5 ) - 1;
	}
	for ( let k = 0; k < amount; k++ ) {
		levelBorders.push( [ value, value + diffs[ j ] - 1 ] );

		value += diffs[ j ];
	}
	if ( levelBorders.length > 99999 ) {
		levelBorders.length = 100000;
		break;
	}
}
levelBorders[ 99999 ][ 1 ] = 1203982336;

// eslint-disable-next-line no-implicit-globals, no-global-assign
SavegameEditor = {
	Name: 'Nintendogs + Cats',
	Filename: 'sysdata.dat',

	/* Constants */
	Constants: {
		MONEY_OFFSET: 0xA0,
		LASTSAVED_OFFSET: 0x10,
		GENDERS: [
			{ value: 0, name: 'Male' },
			{ value: 1, name: 'Female' }
		],
		STREETPASS_MET_OFFSET: 0x98,
		OWNER_POINTS_OFFSET: 0x9C,
		PEDOMETER_OFFSET: 0x218,
		petOffset: [
			0x026A, //    618
			0x1E6A, //  7,786
			0x3A6A, // 14,954
			0x566A, // 22,122
			0x726A, // 29,290
			0x8E6A  // 36,458
		],
		PET_NAME_OFFSET: 0x42,            //  66
		PET_GENDER_OFFSET: 0x56,          //  86
		PET_POINTS_OFFSET_CAT: 0x5A,      //  90
		PET_POINTS_OFFSET_DOG: 0x62,      //  98
		PET_BREED_OFFSET: 0x32,           //  50
		PET_BREED_VARIANT_OFFSET: 0x33,   //  51 = Variant (e.g. Spaniel = 0:Blentheim, 1:Tricolour, 2:Ruby)
		PET_BREED_STYLE_OFFSET: 0x34,     //  52 = Hairstyle
		PET_BREED_EYE_COLOR_OFFSET: 0x35, //  53 = Eye Color (Cats: 0=gray, 1=yellow, 2=blue; Dogs: 255)
		PET_BREED_COLOR_OFFSET: 0x36,     //  54 = Fur Color
		PET1_COMP_DISC_PLAYED: 0x24E,
		PET1_COMP_OBED_PLAYED: 0x24F,
		PET1_COMP_LURE_PLAYED: 0x250,
		PET2_COMP_DISC_PLAYED: 0x251,
		PET2_COMP_OBED_PLAYED: 0x252,
		PET2_COMP_LURE_PLAYED: 0x253,
		PET3_COMP_DISC_PLAYED: 0x254,
		PET3_COMP_OBED_PLAYED: 0x255,
		PET3_COMP_LURE_PLAYED: 0x256,
		PET4_COMP_DISC_PLAYED: 0x257,
		PET4_COMP_OBED_PLAYED: 0x258,
		PET4_COMP_LURE_PLAYED: 0x259,
		PET5_COMP_DISC_PLAYED: 0x25A,
		PET5_COMP_OBED_PLAYED: 0x25B,
		PET5_COMP_LURE_PLAYED: 0x25C,
		PET6_COMP_DISC_PLAYED: 0x25D,
		PET6_COMP_OBED_PLAYED: 0x25E,
		PET6_COMP_LURE_PLAYED: 0x25F,
		PET_PERSONALITIES_OFFSET_DOG1: 0x1F6,
		PET_PERSONALITIES_OFFSET_DOG2: 0x1FA,
		PET_PERSONALITIES_OFFSET_CAT1: 0x1EE,
		PET_PERSONALITIES_OFFSET_CAT2: 0x1F2,
		WALKING_COUNTER_OFFSET: 0x215
	},

	_writeMoney: function () {
		tempFile.writeU32(
			SavegameEditor.Constants.MONEY_OFFSET,
			getValue( 'money' )
		);
	},
	_writeStreetpassMet: function () {
		tempFile.writeU32(
			SavegameEditor.Constants.STREETPASS_MET_OFFSET,
			getValue( 'streetpass-met' )
		);
	},
	_writePedometer: function () {
		tempFile.writeU32(
			SavegameEditor.Constants.PEDOMETER_OFFSET,
			getValue( 'pedometer' )
		);
	},
	_writeWalkingCounter: function () {
		tempFile.writeU8(
			SavegameEditor.Constants.WALKING_COUNTER_OFFSET,
			getValue( 'walking-counter' )
		);
	},
	_writeSupplyAmount: function ( e ) {
		tempFile.writeU8(
			Number( e.target.dataset.offset ),
			getValue( e.target.id )
		);
	},
	_writePetName: function ( e ) {
		const index = Number( ( e.target.id ).match( reg )[ 0 ] );
		const offset = SavegameEditor.Constants.petOffset[ index - 1 ] + SavegameEditor.Constants.PET_NAME_OFFSET;
		tempFile.writeU16String(
			offset,
			10,
			getValue( e.target.id )
		);

		document.getElementsByClassName( 'pet' + index + '_name' )[ 0 ].innerText = getValue( e.target.id );
	},
	_writeUNumber: function ( e, n, o, g ) {
		const index = Number( ( e.target.id ).match( reg )[ 0 ] );
		let petOffset = SavegameEditor.Constants.petOffset[ index - 1 ];
		if ( g ) {
			petOffset = 0;
		}
		const offset = petOffset + SavegameEditor.Constants[ o ];
		tempFile[ 'writeU' + n ](
			offset,
			Number( getValue( e.target.id ) )
		);
	},
	_writePetValue: function ( e ) {
		SavegameEditor._writeUNumber( e, Number( e.target.parentElement.dataset.size ), e.target.parentElement.dataset.var, e.target.parentElement.dataset.global );
	},
	_getPetData( petOffset, val, size ) {
		return tempFile[ 'readU' + ( size || 8 ) ]( SavegameEditor.Constants.petOffset[ petOffset ] + SavegameEditor.Constants[ val ] );
	},
	_markAsChanged( e ) {
		e.target.dataset.dataChanged = true;
	},
	/* check if savegame is valid */
	checkValidSavegame: function () {
		return ( tempFile.fileSize === 60936 );
	},

	preload: function () {
		const btnLastSaved = document.getElementById( 'update-lastsaved' );
		btnLastSaved.addEventListener( 'click', () => {
			tempFile.writeU32(
				SavegameEditor.Constants.LASTSAVED_OFFSET,
				Math.floor( Date.now() * 0.001 )
			);
			const a = new Date( Number( tempFile.readU32( SavegameEditor.Constants.LASTSAVED_OFFSET ) ) * 1000 );
			a.setHours( a.getHours() - a.getTimezoneOffset() / 60 );
			setValue( 'lastsaved', a.toLocaleString( 'en-GB', {
				day: 'numeric',
				month: 'short',
				year: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
				second: '2-digit'
			} ) );
		}, false );
		get( 'number-money' ).addEventListener( 'change', SavegameEditor._writeMoney );
		get( 'number-streetpass-met' ).addEventListener( 'change', SavegameEditor._writeStreetpassMet );
		get( 'number-pedometer' ).addEventListener( 'change', SavegameEditor._writePedometer );
		get( 'number-walking-counter' ).addEventListener( 'change', SavegameEditor._writeWalkingCounter );
		fetch( '/savegame-editors/nintendogs+cats/supplies.json' )
			.then( ( response ) => response.json() ).then( ( data ) => {
				let counter = 0;
				for ( const rowtype of [
					[ 'fooddrink', 'food & drink' ],
					[ 'toys', 'toys' ],
					[ 'accessories', 'accessories' ],
					[ 'furniture', 'furnitures' ],
					[ 'leashes', 'leashes' ],
					[ 'skins', 'skins' ]
				] ) {
					const rt = get( 'row-' + rowtype[ 0 ] );
					counter = 0;
					for ( const entry of data[ rowtype[ 1 ] ] ) {
						rt.append(
							col( 3, span( entry[ 1 ] ) ),
							col( 1, inputNumber( 'supplies_' + rowtype[ 0 ] + '_' + counter + '_amount', 0, 99, tempFile.readU8( Number( entry[ 0 ] ) ) ) )
						);
						get( 'number-supplies_' + rowtype[ 0 ] + '_' + counter + '_amount' ).dataset.offset = entry[ 0 ];
						get( 'number-supplies_' + rowtype[ 0 ] + '_' + counter + '_amount' ).addEventListener( 'change', SavegameEditor._writeSupplyAmount );
						counter++;
					}
					const lastRow = counter % 3;
					if ( lastRow !== 0 ) {
						rt.append( col( ( 3 - lastRow ) * 4, span( '' ) ) );
					}
				}
			} ).catch( ( error ) => {
				// eslint-disable-next-line no-console
				console.log( '[Picross Save Editor]', error );
			} );
	},

	/* load function */
	load: function () {
		tempFile.fileName = 'sysdata.dat';
		tempFile.littleEndian = true;

		setValue( 'money', tempFile.readU32( SavegameEditor.Constants.MONEY_OFFSET ) );
		setNumericRange( 'money', 0, 9999999 );

		setValue( 'streetpass-met', tempFile.readU32( SavegameEditor.Constants.STREETPASS_MET_OFFSET ) );
		setNumericRange( 'streetpass-met', 0, 9999999 );

		setValue( 'pedometer', tempFile.readU32( SavegameEditor.Constants.PEDOMETER_OFFSET ) );
		setNumericRange( 'pedometer', 0, 9999999 );

		setValue( 'walking-counter', tempFile.readU8( SavegameEditor.Constants.WALKING_COUNTER_OFFSET ) );
		setNumericRange( 'walking-counter', 0, 255 );

		setNumericRange( 'owner-points', 0, 99999 );
		const ownerPoints = tempFile.readU32( SavegameEditor.Constants.OWNER_POINTS_OFFSET );
		for ( let k = 0; k < levelBorders.length; k++ ) {
			if ( ownerPoints >= levelBorders[ k ][ 0 ] && ownerPoints <= levelBorders[ k ][ 1 ] ) {
				setValue( 'owner-points', k );
				break;
			}
		}
		get( 'number-owner-points' ).addEventListener( 'change', SavegameEditor._markAsChanged );

		const a = new Date( Number(
			tempFile.readU32( SavegameEditor.Constants.LASTSAVED_OFFSET )
		) * 1000 );
		setValue( 'lastsaved', a.toLocaleString( 'en-GB', {
			day: 'numeric',
			month: 'short',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			timezone: 'Europe/London'
		} ) );
		const petTabs = document.getElementById( 'petTabs' ),
			petTabsContentSeperator = document.createElement( 'div' ),
			template = document.getElementById( 'template-row-pet' );
		petTabs.innerText = '';
		petTabs.appendChild( petTabsContentSeperator );
		for ( let i = 1; i < 7; i++ ) {
			if ( tempFile.readU8( SavegameEditor.Constants.petOffset[ i - 1 ] ) < 1 ) {
				continue;
			}
			const petTabInput = document.createElement( 'input' );
			petTabInput.className = 'pet_tab';
			petTabInput.id = 'pet_tab' + i;
			petTabInput.name = 'pet_tabgroup';
			petTabInput.type = 'radio';
			petTabs.insertBefore( petTabInput, petTabsContentSeperator );
			const petTabLabel = document.createElement( 'label' );
			petTabLabel.className = 'pet_label';
			petTabLabel.setAttribute( 'for', 'pet_tab' + i );
			petTabs.insertBefore( petTabLabel, petTabsContentSeperator );

			const templateClone = template.content.cloneNode( true );
			templateClone.querySelector( '.row' ).id = 'row-pet' + i;
			for ( const ele of templateClone.querySelectorAll( '.update-name' ) ) {
				if ( ( ele.id || '' ).includes( 'petX' ) ) {
					ele.id = ele.id.replaceAll( 'petX', 'pet' + i );
				}
				if ( ele.getAttribute( 'for' ) ) {
					ele.setAttribute( 'for', ele.getAttribute( 'for' ).replaceAll( 'petX', 'pet' + i ) );
				}
				if ( ( ele.dataset && ele.dataset.var || '' ).includes( 'PETX' ) ) {
					ele.dataset.var = ele.dataset.var.replaceAll( 'PETX', 'PET' + i );
				}
			}
			const breed = SavegameEditor._getPetData( i - 1, 'PET_BREED_OFFSET' );
			let isDog = true;
			if ( breed > 28 && breed < 32 ) {
				isDog = false;
			}
			petTabs.appendChild( templateClone );
			const dialogClassName = 'page-' +
				breed +
				'-' +
				SavegameEditor._getPetData( i - 1, 'PET_BREED_VARIANT_OFFSET' );
			const dialogEle = document.getElementsByClassName(
				dialogClassName
			)[ 0 ];
			if ( !isDog ) {
				document.getElementById( 'eyecolor' ).querySelector( '[data-offset="' + SavegameEditor._getPetData( i - 1, 'PET_BREED_EYE_COLOR_OFFSET' ) + '"]' ).checked = true;
			}
			window._sidebarEvent( {
				target: dialogEle
			} );
			let breedImg = document.createElement( 'img' );
			const breedImgTmp = document
				.getElementById( 'menu-content' )
				.getElementsByClassName( dialogClassName )[ 0 ]
				.querySelector( 'div[data-color="' + SavegameEditor._getPetData( i - 1, 'PET_BREED_COLOR_OFFSET' ) + '"][data-style="' + SavegameEditor._getPetData( i - 1, 'PET_BREED_STYLE_OFFSET' ) + '"]'
				);
			if ( breedImgTmp ) {
				breedImg = breedImgTmp.cloneNode();
			}
			petTabLabel.appendChild( breedImg );

			const dialogbtn = get( 'change-pet' + i + '-btn' );
			dialogbtn.dataset.pet = i - 1;
			// eslint-disable-next-line no-loop-func
			dialogbtn.onclick = function ( e ) {
				e.preventDefault();
				get( 'menu' ).dataset.pet = e.target.dataset.pet;
				get( 'menu' ).showModal();
				const breed_ = SavegameEditor._getPetData( e.target.dataset.pet, 'PET_BREED_OFFSET' );
				const dialogClassName_ = 'page-' +
					breed_ +
					'-' +
					SavegameEditor._getPetData( e.target.dataset.pet, 'PET_BREED_VARIANT_OFFSET' );
				const dialogEle_ = document.getElementsByClassName(
					dialogClassName_
				)[ 0 ];
				if ( breed_ > 28 && breed_ < 32 ) {
					document.getElementById( 'eyecolor' ).querySelector( '[data-offset="' + SavegameEditor._getPetData( e.target.dataset.pet, 'PET_BREED_EYE_COLOR_OFFSET' ) + '"]' ).checked = true;
				}
				window._sidebarEvent( {
					target: dialogEle_
				} );
			};

			get( 'container-pet' + i + '-gender' ).appendChild( select( 'pet' + i + '-gender', SavegameEditor.Constants.GENDERS, SavegameEditor._writePetValue ) );

			setValue( 'pet' + i + '-name', tempFile.readU16String( SavegameEditor.Constants.petOffset[ i - 1 ] + SavegameEditor.Constants.PET_NAME_OFFSET, 10 ) );
			const petTabLabelName = petTabLabel.appendChild( document.createElement( 'span' ) );
			// eslint-disable-next-line mediawiki/class-doc
			petTabLabelName.className = 'pet' + i + '_name';
			petTabLabelName.innerText = getValue( 'pet' + i + '-name' );
			setValue( 'pet' + i + '-gender', SavegameEditor._getPetData( i - 1, 'PET_GENDER_OFFSET' ) );
			get( 'input-pet' + i + '-name' ).addEventListener( 'change', SavegameEditor._writePetName );

			setNumericRange( 'pet' + i + '-disc-played', 0, 2 );
			setValue( 'pet' + i + '-disc-played', tempFile.readU8( SavegameEditor.Constants[ 'PET' + i + '_COMP_DISC_PLAYED' ] ) );
			get( 'number-pet' + i + '-disc-played' ).addEventListener( 'change', SavegameEditor._writePetValue );
			setNumericRange( 'pet' + i + '-lure-played', 0, 2 );
			setValue( 'pet' + i + '-lure-played', tempFile.readU8( SavegameEditor.Constants[ 'PET' + i + '_COMP_LURE_PLAYED' ] ) );
			get( 'number-pet' + i + '-lure-played' ).addEventListener( 'change', SavegameEditor._writePetValue );
			setNumericRange( 'pet' + i + '-obed-played', 0, 2 );
			setValue( 'pet' + i + '-obed-played', tempFile.readU8( SavegameEditor.Constants[ 'PET' + i + '_COMP_OBED_PLAYED' ] ) );
			get( 'number-pet' + i + '-obed-played' ).addEventListener( 'change', SavegameEditor._writePetValue );

			const personality = window.personalities[ SavegameEditor._getPetData( i - 1, 'PET_PERSONALITIES_OFFSET_' + ( isDog ? 'DOG' : 'CAT' ) + '1', 8 ) ][ SavegameEditor._getPetData( i - 1, 'PET_PERSONALITIES_OFFSET_' + ( isDog ? 'DOG' : 'CAT' ) + '2', 8 ) ];
			setValue( 'pet' + i + '-personality', personality[ Number( SavegameEditor._getPetData( i - 1, 'PET_GENDER_OFFSET' ) ) ] );

			setNumericRange( 'pet' + i + '-level', 0, 99999 );
			const points = SavegameEditor._getPetData( i - 1, ( isDog ? 'PET_POINTS_OFFSET_DOG' : 'PET_POINTS_OFFSET_CAT' ), 32 );
			for ( let j = 0; j < levelBorders.length; j++ ) {
				if ( points >= levelBorders[ j ][ 0 ] && points <= levelBorders[ j ][ 1 ] ) {
					setValue( 'pet' + i + '-level', j );
					break;
				}
			}
			const levelEle = get( 'number-pet' + i + '-level' );
			levelEle.dataset.isDog = isDog;
			levelEle.addEventListener( 'change', SavegameEditor._markAsChanged );
		}
		petTabs.querySelector( 'input' ).checked = true;
		petTabs.removeChild( petTabsContentSeperator );
	},

	/* save function */
	save: function () {
		const changedLevels = document.querySelectorAll( '[data-data-changed]' );
		for ( let i = 0; i < changedLevels.length; i++ ) {
			const valueOld = changedLevels[ i ].value;
			setNumericRange( changedLevels[ i ].id.slice( 7 ) );
			changedLevels[ i ].value = levelBorders[ changedLevels[ i ].value ][ 0 ];
			if ( changedLevels[ i ].id === 'number-owner-points' ) {
				tempFile.writeU32(
					SavegameEditor.Constants.OWNER_POINTS_OFFSET,
					getValue( 'owner-points' )
				);
			} else {
				SavegameEditor._writeUNumber(
					{ target: { id: changedLevels[ i ].id } },
					32,
					changedLevels[ i ].dataset.isDog ? 'PET_POINTS_OFFSET_DOG' : 'PET_POINTS_OFFSET_CAT'
				);
			}
			changedLevels[ i ].value = valueOld;
			delete changedLevels[ i ].dataset.dataChanged;
			setNumericRange( changedLevels[ i ].id.slice( 0, 99999 ) );
		}
	}
};
