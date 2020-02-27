import React, { lazy, Suspense, useState } from 'react';
import Footer from './Footer';
import Footer2 from 'website2/Footer';

const Title = lazy(() => import('website2/Title'));

export default () => {
	return (
		<>
			<Suspense fallback={'fallback'}>
				<Title />
			</Suspense>
			<p>
				This app loads the heading above from website2, and doesnt expose
				anything itself.
			</p>
			<Footer />
			<Footer2 />
		</>
	);
};
