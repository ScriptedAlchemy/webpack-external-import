import React, { lazy, Suspense, useState } from 'react';

const Title = lazy(() => import('website2/Title'));

export default () => {
	return (
		<Suspense fallback={'fallback'}>
			<Title />
			<p>
				This app loads the heading above from website2, and doesnt expose
				anything itself.
			</p>
		</Suspense>
	);
};
