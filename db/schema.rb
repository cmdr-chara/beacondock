# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.1].define(version: 2026_11_15_000001) do
  create_table "api_keys", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "name", null: false
    t.string "token_digest", null: false
    t.string "token_prefix", null: false
    t.datetime "last_used_at"
    t.datetime "revoked_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token_digest"], name: "index_api_keys_on_token_digest", unique: true
    t.index ["user_id"], name: "index_api_keys_on_user_id"
  end

  create_table "checks", force: :cascade do |t|
    t.integer "monitor_id", null: false
    t.integer "status", null: false
    t.integer "http_status"
    t.float "latency_ms"
    t.string "error"
    t.datetime "checked_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["checked_at"], name: "index_checks_on_checked_at"
    t.index ["monitor_id", "checked_at"], name: "index_checks_on_monitor_id_and_checked_at"
    t.index ["monitor_id"], name: "index_checks_on_monitor_id"
  end

  create_table "incidents", force: :cascade do |t|
    t.integer "monitor_id", null: false
    t.datetime "started_at", null: false
    t.datetime "resolved_at"
    t.string "cause"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["monitor_id", "resolved_at"], name: "index_incidents_on_monitor_id_and_resolved_at"
    t.index ["monitor_id"], name: "index_incidents_on_monitor_id"
  end

  create_table "monitors", force: :cascade do |t|
    t.integer "user_id", null: false
    t.string "name", null: false
    t.string "url", null: false
    t.string "http_method", default: "GET", null: false
    t.integer "interval_seconds", default: 300, null: false
    t.integer "timeout_seconds", default: 10, null: false
    t.integer "expected_status", default: 200, null: false
    t.integer "warn_latency_ms", default: 1500, null: false
    t.boolean "active", default: true, null: false
    t.integer "last_status", default: 0, null: false
    t.datetime "last_checked_at"
    t.integer "consecutive_failures", default: 0, null: false
    t.datetime "next_check_at"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["active", "next_check_at"], name: "index_monitors_on_active_and_next_check_at"
    t.index ["user_id"], name: "index_monitors_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email_address", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email_address"], name: "index_users_on_email_address", unique: true
  end

  add_foreign_key "api_keys", "users"
  add_foreign_key "checks", "monitors"
  add_foreign_key "incidents", "monitors"
  add_foreign_key "monitors", "users"
end
