/* eslint-disable no-undef, es-x/no-string-prototype-replaceall, no-underscore-dangle */
/* globals get, tempFile */
const spriteBaseURL = 'https://www.spriters-resource.com/resources/sheets/112/%0.png',
	spriteBaseURLLocal = 'sprites/%0.png',
	useLocal = false,
	spriteData = {
		// Dogs
		bassetHound: [ '114733', 6 ],
		beagle: [ '114732', 6 ],
		boxer: [ '114888', 6 ],
		bullTerrier: [ '114889', 6 ],
		chihuahua: [ '114890', 6 ],
		chihuahua1: [ '114890', 2 ],
		cockerSpaniel: [ '114893', 5 ],
		dalmatian: [ '114891', 6 ],
		frenchBulldog: [ '114892', 5 ],
		germanShepherdDog: [ '114896', 6 ],
		goldenRetriever: [ '114737', 6 ],
		greatDane: [ '114895', 6 ],
		jackRussellTerrier: [ '114898', 6 ],
		labradorRetriever: [ '114900', 5 ],
		labradorRetriever1: [ '114900', 1 ],
		maltese: [ '114734', 6 ],
		miniatureDachshund: [ '114902', 5 ],
		miniatureDachshund1: [ '114902', 1 ],
		miniaturePinscher: [ '114903', 5 ],
		miniatureSchnauzer: [ '114904', 5 ],
		miniatureSchnauzer1: [ '114904', 1 ],
		pembrokeWelshCorgi: [ '114899', 6 ],
		pomeranian: [ '114907', 6 ],
		pomeranian1: [ '114907', 1 ],
		pug: [ '114906', 5 ],
		roboPup: [ '114735', 5 ],
		shetlandSheepdog: [ '114912', 6 ],
		shiba: [ '114908', 5 ],
		shihTzu: [ '114909', 5 ],
		siberianHusky: [ '114897', 6 ],
		spaniel: [ '114901', 5 ],
		toyPoodle: [ '114905', 5 ],
		toyPoodle1: [ '114905', 1 ],
		yorkshireTerrier: [ '114736', 6 ],
		// Cats
		standard: [ '114911', 6 ],
		oriental: [ '114910', 6 ],
		longhair: [ '114894', 18 ]
	};
window.spriteData = spriteData;

const _writeU8 = function ( variable, value ) {
	tempFile.writeU8(
		SavegameEditor.Constants.petOffset[ get( 'menu' ).dataset.pet ] + SavegameEditor.Constants[ variable ],
		Number( value )
	);
};

window.addEventListener( 'load', () => {
	'use strict';
	const btnClose = document.getElementById( 'menu-close' ),
		content = document.getElementById( 'menu-content' ),
		eyecolor = document.getElementById( 'eyecolor' ),
		menu = document.getElementById( 'menu' ),
		sidebarCat = document.getElementById( 'menu-sidebar-cat' ),
		sidebarDog = document.getElementById( 'menu-sidebar-dog' );

	const sidebarEvent = function ( e ) {
		if ( !e.target || !e.target.className || !e.target.className.startsWith( 'page-' ) ) {
			return;
		}
		let old = sidebarDog.querySelector( 'div[open]' );
		if ( old ) {
			old.removeAttribute( 'open' );
			content.querySelector( '.' + old.className ).style.display = 'none';
		}
		old = sidebarCat.querySelector( 'div[open]' );
		if ( old ) {
			old.removeAttribute( 'open' );
			content.querySelector( '.' + old.className ).style.display = 'none';
		}
		const tmp = e.target.className.match( /\d+/g );
		menu.dataset.type = ( tmp[ 0 ] >= 29 && tmp[ 0 ] <= 31 ) ? 'cat' : 'dog';
		e.target.setAttribute( 'open', true );
		let eyeColorOffset = 255,
			newContent = content.querySelector( '.' + e.target.className );
		if ( menu.dataset.type === 'cat' ) {
			eyeColorOffset = Number( document.getElementById( 'eyecolor' ).querySelector( ':checked' ).dataset.offset );
		}
		if ( newContent && menu.dataset.type === 'cat' ) {
			newContent.parentElement.removeChild( newContent );
			newContent = undefined;
		}
		if ( !newContent ) {
			newContent = content.appendChild( document.createElement( 'div' ) );
			// eslint-disable-next-line mediawiki/class-doc
			newContent.className = e.target.className;
			const offset = Number( e.target.getAttribute( 'image-offset' ) ),
				sD = spriteData[ e.target.getAttribute( 'breed' ) ];
			let offX = -4,
				offY = -4 - 68 * Math.ceil( offset / sD[ 1 ] ),
				color = 0,
				style = 0;
			const iMax = offset + Number( e.target.getAttribute( 'image-items' ) );
			let correctionXOffset = 0;
			let correctionYOffset = 0;
			for ( let i = offset; i < iMax; i++ ) {
				if ( newContent.className === 'page-9-1' && color === 2 ) { // Fix for Labrador Retriever - Black
					correctionYOffset = 68;
				} else if ( newContent.className === 'page-17-22' ) { // Fix for German Shepherd Dog - White
					correctionXOffset = 340;
				} else if ( newContent.className === 'page-14-2' ) { // Fix for Miniature Schnauzer - Surprise Me #1
					if ( i === 12 ) { // Correct image 1
						correctionYOffset = 68 * 3;
					} else if ( i === 13 ) { // Correct image 2
						correctionYOffset = 68 * 7;
					} else if ( i === 14 || i === 15 || i === 16 ) { // Correct images 3, 4 and 5
						correctionYOffset = -( 68 * 2 );
					}
				} else if ( newContent.className === 'page-14-12' ) { // Fix for Miniature Schnauzer - Surprise Me #2
					if ( i === 21 ) { // Correct image 5
						correctionYOffset = 0;
					} else {
						correctionYOffset = -68;
					}
				}
				if ( menu.dataset.type === 'dog' || ( i - offset ) % 3 === eyeColorOffset ) {
					const baseURL = useLocal && spriteBaseURLLocal || spriteBaseURL,
						ele = newContent.appendChild( document.createElement( 'div' ) );
					ele.className = 'sprite';
					ele.dataset.color = color;
					ele.dataset.eyeColor = eyeColorOffset;
					ele.dataset.style = style;
					ele.style.backgroundImage = 'url(' + baseURL.replaceAll( '%0', sD[ 0 ] ) + ')';
					ele.style.backgroundPosition = ( offX - correctionXOffset ) + 'px ' + ( offY - correctionYOffset ) + 'px';
					style++;
				}
				offX -= 68;
				if (
					( ( i - offset ) > 0 || sD[ 1 ] === 1 ) &&
					( i - offset ) % sD[ 1 ] === sD[ 1 ] - 1
				) {
					offX = -4;
					offY -= 68;
				}
				if ( style >= ( e.target.dataset.percolor || 6 ) ) {
					color++;
					style = 0;
				}
			}
			newContent.style.width = 74 * ( e.target.dataset.percolor || 6 ) + 'px';
		} else {
			newContent.style.removeProperty( 'display' );
		}
		e.target.scrollIntoView();
	};
	window._sidebarEvent = sidebarEvent;
	sidebarDog.addEventListener( 'click', sidebarEvent, false );
	sidebarCat.addEventListener( 'click', sidebarEvent, false );
	eyecolor.addEventListener( 'change', () => {
		sidebarCat.querySelector( '[open]' ).click();
	}, false );

	content.addEventListener( 'click', ( e ) => {
		if ( !e.target.className.includes( 'sprite' ) ) {
			return;
		}
		const tmp = e.target.parentElement.className.match( /\d+/g ),
			newImage = e.target.cloneNode();
		_writeU8( 'PET_BREED_OFFSET', tmp[ 0 ] );
		_writeU8( 'PET_BREED_VARIANT_OFFSET', tmp[ 1 ] );
		_writeU8( 'PET_BREED_COLOR_OFFSET', e.target.dataset.color );
		_writeU8( 'PET_BREED_EYE_COLOR_OFFSET', e.target.dataset.eyeColor );
		_writeU8( 'PET_BREED_STYLE_OFFSET', e.target.dataset.style );
		document.querySelector( 'label[for="pet_tab' + ( Number( get( 'menu' ).dataset.pet ) + 1 ) + '"] .sprite' ).replaceWith( newImage );
		btnClose.click();
	}, false );
	btnClose.addEventListener( 'click', ( e ) => {
		e.preventDefault();
		menu.close();
	}, false );
	sidebarEvent( { target: document.getElementsByClassName( 'page-0-0' )[ 0 ] } );
}, false );
