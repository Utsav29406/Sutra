-- Sutra — MySQL schema
-- Apply with:  node sql/apply-schema.mjs

CREATE TABLE IF NOT EXISTS users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120)  NOT NULL,
  email         VARCHAR(190)  NOT NULL,
  password_hash VARCHAR(100)  NOT NULL,
  phone         VARCHAR(20)   DEFAULT NULL,
  role          ENUM('USER','ADMIN') NOT NULL DEFAULT 'USER',
  created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Orders keep the human-readable id the checkout already generates (SUT-…).
-- `email` is not a foreign key: guest checkout is allowed and leaves no account.
CREATE TABLE IF NOT EXISTS orders (
  id             VARCHAR(32)  NOT NULL,
  email          VARCHAR(190) NOT NULL DEFAULT '',
  placed_at      DATETIME     NOT NULL,
  updated_at     DATETIME     DEFAULT NULL,
  total          DECIMAL(10,2) NOT NULL,
  discount       DECIMAL(10,2) DEFAULT NULL,
  coupon_code    VARCHAR(40)  DEFAULT NULL,
  payment_method ENUM('cod','card') NOT NULL DEFAULT 'cod',
  address        VARCHAR(500) NOT NULL,
  customer_name  VARCHAR(120) DEFAULT NULL,
  phone          VARCHAR(20)  DEFAULT NULL,
  status         ENUM('Processing','Shipped','Delivered','Cancelled','Return Requested','Returned')
                 NOT NULL DEFAULT 'Processing',
  PRIMARY KEY (id),
  KEY idx_orders_email (email),
  KEY idx_orders_placed_at (placed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per line item. Deleting an order takes its lines with it.
CREATE TABLE IF NOT EXISTS order_items (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id   VARCHAR(32)  NOT NULL,
  product_id VARCHAR(64)  NOT NULL DEFAULT '',
  slug       VARCHAR(160) NOT NULL DEFAULT '',
  name       VARCHAR(200) NOT NULL,
  size       VARCHAR(32)  NOT NULL,
  quantity   INT UNSIGNED NOT NULL DEFAULT 1,
  price      DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews. `order_id` is set only for the post-delivery feedback flow; reviews
-- written straight from a product page leave it NULL.
CREATE TABLE IF NOT EXISTS reviews (
  id         VARCHAR(64)  NOT NULL,
  product_id VARCHAR(64)  NOT NULL,
  order_id   VARCHAR(32)  DEFAULT NULL,
  author     VARCHAR(120) NOT NULL,
  rating     TINYINT UNSIGNED NOT NULL,
  body       VARCHAR(500) NOT NULL DEFAULT '',
  written_at DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_reviews_product (product_id),
  KEY idx_reviews_order (order_id),
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id)
    REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Password-reset codes.
--
-- The code itself is never stored, only an HMAC of it. The row exists so that
-- failed attempts can be COUNTED: the old design put a signed challenge in the
-- browser and kept no server record, so nothing could tell that the same code
-- had already been guessed wrongly a thousand times.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS otp_challenges (
  id         VARCHAR(64)  NOT NULL,
  identifier VARCHAR(190) NOT NULL,
  code_hash  VARCHAR(120) NOT NULL,
  expires_at DATETIME     NOT NULL,
  attempts   TINYINT UNSIGNED NOT NULL DEFAULT 0,
  used       TINYINT(1)   NOT NULL DEFAULT 0,
  dead       TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL,
  PRIMARY KEY (id),
  KEY idx_otp_challenges_identifier (identifier, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Escalating cooldown, one row per address.
--
-- This pauses password RESET only. The account is never locked: if a wrong
-- guess could lock the account, anyone could disable any customer just by
-- requesting a reset for their address and failing the code on purpose.
CREATE TABLE IF NOT EXISTS otp_locks (
  identifier   VARCHAR(190) NOT NULL,
  dead_streak  TINYINT UNSIGNED NOT NULL DEFAULT 0,
  strikes      TINYINT UNSIGNED NOT NULL DEFAULT 0,
  paused_until DATETIME DEFAULT NULL,
  updated_at   DATETIME NOT NULL,
  PRIMARY KEY (identifier)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
