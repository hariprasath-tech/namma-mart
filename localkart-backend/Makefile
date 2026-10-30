.PHONY: help install seed dev test test-api test-ml test-contract test-load ml-download ml-train ml-eval ml-run

help:
	@echo "LocalKart v3 (TRL 3) Master Commands:"
	@echo "  make install        Install Node and Python dependencies"
	@echo "  make seed           Migrate database and populate 6-month historical demo data"
	@echo "  make ml-download    Download pretrained weights and sample video/images"
	@echo "  make ml-train       Train LightGBM demand forecaster and FP-Growth association rules"
	@echo "  make ml-eval        Evaluate models on held-out splits and write ml/reports/metrics.json"
	@echo "  make ml-run         Execute the end-to-end ML inference demo pipeline"
	@echo "  make test           Run all test suites (API Vitest + ML Pytest + Contracts)"
	@echo "  make dev            Start development API and ML servers"

install:
	cd api && npm install
	cd ml && pip install -r requirements.txt

seed:
	cd api && npx prisma db push && npm run seed

ml-download:
	python ml/training/download_samples.py

ml-train:
	python ml/training/forecast/train.py
	python ml/training/assoc/mine.py

ml-eval:
	python ml/training/eval_all.py

ml-run:
	python ml/app/cli.py run-demo

test: test-api test-ml test-contract

test-api:
	cd api && npm run test

test-ml:
	pytest ml/tests -v

test-contract:
	cd api && npm run test:contract

test-load:
	k6 run api/tests/load/k6_search_compare.js

dev:
	# Starts both API and ML in parallel
	python ml/app/main.py &
	cd api && npm run dev
