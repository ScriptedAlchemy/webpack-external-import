import React, { lazy, Suspense } from 'react';
import Footer from 'website1/Footer';
import Footer2 from './Footer';

const Title = lazy(() => import('./Title'));

export default () => (
	<>
		<Suspense fallback={'fallback'}>
			<Title />
		</Suspense>
		<p>This app loads title directly, and also exposes it.</p>
		<Footer />
		<Footer2 />
	</>
);
