invalidate_cloudfront_cache:
	aws cloudfront create-invalidation --distribution-id ELC5P9YAVVXA6 --paths "/*"
	aws cloudfront create-invalidation --distribution-id ECT0QC99SNJ0W --paths "/*"
	aws cloudfront create-invalidation --distribution-id EFTZE8QBWO66L --paths "/*"
	aws cloudfront create-invalidation --distribution-id E1WR0KQRN521WJ --paths "/*"
	aws cloudfront create-invalidation --distribution-id EYHWYA2ZWSX3G --paths "/*"
	aws cloudfront create-invalidation --distribution-id EQXMMCQ3COMQN --paths "/*"
