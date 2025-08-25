package database

import (
	"database/sql"
	"fmt"
	_ "github.com/lib/pq"
)

func ConnectDB(user, password, dbName, host, port string) (*sql.DB, error) {
	connStr := fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable", host, port, user, password, dbName)

	db, err := sql.Open("postgres", connStr)
	if err != nil {
		return nil, err
	}

	if err = db.Ping(); err != nil {
		return nil, err	
	}

	fmt.Println("Connected to database")
	return db, nil
}
