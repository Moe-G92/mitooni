def pytest_addoption(parser):
    parser.addoption('--local-postgres',action='store_true',help='Run against the dedicated synthetic localhost Mitooni database')
