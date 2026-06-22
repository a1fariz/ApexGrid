--
-- PostgreSQL database dump
--

\restrict KPvE9ejhFwQZfguxaXKb3ZiA5bAIXQj5KQ1lwYdkkYccYe0tWZyCJxwxtISjbD0

-- Dumped from database version 15.18
-- Dumped by pg_dump version 15.18

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: set_booking_expiry(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_booking_expiry() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.expired_at = NEW.created_at + INTERVAL '30 minutes';
    RETURN NEW;
END;
$$;


--
-- Name: update_race_quota(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_race_quota() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    -- Reduce quota when booking confirmed
    IF OLD.status = 'PENDING'
       AND NEW.status = 'CONFIRMED' THEN

        UPDATE races
        SET available_quota = available_quota - NEW.quantity
        WHERE id = NEW.race_id;

    END IF;

    -- Restore quota ONLY if previously confirmed
    IF OLD.status = 'CONFIRMED'
       AND NEW.status = 'CANCELLED' THEN

        UPDATE races
        SET available_quota = available_quota + NEW.quantity
        WHERE id = NEW.race_id;

    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    booking_code character varying(20) NOT NULL,
    user_id integer NOT NULL,
    race_id integer NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    total_price numeric(12,2) DEFAULT 0.00 NOT NULL,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    ticket_pdf_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expired_at timestamp without time zone,
    confirmed_at timestamp without time zone,
    cancelled_at timestamp without time zone,
    scanned_at timestamp without time zone,
    cancellation_reason character varying(255),
    zone character varying(10) DEFAULT 'GA'::character varying,
    user_email character varying(100),
    user_full_name character varying(100),
    username character varying(50),
    CONSTRAINT chk_quantity CHECK ((quantity > 0)),
    CONSTRAINT chk_total_price CHECK ((total_price >= (0)::numeric))
);


--
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- Name: circuits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.circuits (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    location character varying(100) NOT NULL,
    country character varying(100) NOT NULL,
    length_km numeric(6,3),
    number_of_laps integer,
    lap_record character varying(50),
    lap_record_holder character varying(100),
    image_url text,
    description text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: circuits_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.circuits_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: circuits_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.circuits_id_seq OWNED BY public.circuits.id;


--
-- Name: email_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_logs (
    id integer NOT NULL,
    recipient_email character varying(100) NOT NULL,
    subject character varying(255) NOT NULL,
    body text,
    email_type character varying(50) DEFAULT 'BOOKING_CONFIRMATION'::character varying,
    booking_id integer,
    status character varying(20) DEFAULT 'PENDING'::character varying,
    retry_count integer DEFAULT 0,
    sent_at timestamp without time zone,
    error_message text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: email_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.email_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: email_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.email_logs_id_seq OWNED BY public.email_logs.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expired_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: races; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.races (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    circuit_id integer NOT NULL,
    race_date timestamp without time zone NOT NULL,
    race_time time without time zone,
    season integer DEFAULT 2026 NOT NULL,
    round integer,
    total_quota integer DEFAULT 1000 NOT NULL,
    available_quota integer DEFAULT 1000 NOT NULL,
    ticket_price numeric(12,2) DEFAULT 0.00 NOT NULL,
    currency character varying(3) DEFAULT 'USD'::character varying,
    description text,
    status character varying(20) DEFAULT 'UPCOMING'::character varying,
    image_url text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_price CHECK ((ticket_price >= (0)::numeric)),
    CONSTRAINT chk_quota CHECK (((available_quota >= 0) AND (available_quota <= total_quota)))
);


--
-- Name: races_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.races_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: races_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.races_id_seq OWNED BY public.races.id;


--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.refresh_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expiry_date timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.refresh_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.refresh_tokens_id_seq OWNED BY public.refresh_tokens.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(100),
    role_id integer DEFAULT 1 NOT NULL,
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: v_admin_statistics; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_admin_statistics AS
 SELECT count(*) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)) AS total_confirmed_bookings,
    count(*) FILTER (WHERE ((b.status)::text = 'PENDING'::text)) AS total_pending_bookings,
    count(*) FILTER (WHERE ((b.status)::text = 'CANCELLED'::text)) AS total_cancelled_bookings,
    COALESCE(sum(b.total_price) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::numeric) AS total_revenue,
    COALESCE(sum(b.quantity) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::bigint) AS total_tickets_sold,
    count(DISTINCT b.user_id) AS total_unique_customers
   FROM public.bookings b;


--
-- Name: v_booking_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_booking_summary AS
 SELECT b.id,
    b.booking_code,
    b.user_id,
    b.race_id,
    b.quantity,
    b.total_price,
    b.status,
    b.created_at,
    b.expired_at,
    r.name AS race_name,
    r.race_date,
    c.name AS circuit_name,
    c.country
   FROM ((public.bookings b
     JOIN public.races r ON ((b.race_id = r.id)))
     JOIN public.circuits c ON ((r.circuit_id = c.id)));


--
-- Name: v_race_popularity; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_race_popularity AS
 SELECT r.id AS race_id,
    r.name AS race_name,
    c.name AS circuit_name,
    c.country,
    r.race_date,
    r.total_quota,
    r.available_quota,
    COALESCE(sum(b.quantity) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::bigint) AS tickets_sold,
    COALESCE(sum(b.total_price) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::numeric) AS revenue,
    count(b.id) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)) AS confirmed_bookings
   FROM ((public.races r
     JOIN public.circuits c ON ((r.circuit_id = c.id)))
     LEFT JOIN public.bookings b ON ((b.race_id = r.id)))
  GROUP BY r.id, r.name, c.name, c.country, r.race_date, r.total_quota, r.available_quota
  ORDER BY COALESCE(sum(b.quantity) FILTER (WHERE ((b.status)::text = 'CONFIRMED'::text)), (0)::bigint) DESC;


--
-- Name: v_race_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.v_race_summary AS
 SELECT r.id,
    r.name,
    r.race_date,
    r.race_time,
    r.season,
    r.round,
    r.total_quota,
    r.available_quota,
    r.ticket_price,
    r.currency,
    r.status,
    c.name AS circuit_name,
    c.location,
    c.country,
    c.image_url AS circuit_image
   FROM (public.races r
     JOIN public.circuits c ON ((r.circuit_id = c.id)));


--
-- Name: verification_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.verification_tokens (
    id integer NOT NULL,
    user_id integer NOT NULL,
    token character varying(255) NOT NULL,
    expired_at timestamp without time zone NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.verification_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.verification_tokens_id_seq OWNED BY public.verification_tokens.id;


--
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- Name: circuits id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circuits ALTER COLUMN id SET DEFAULT nextval('public.circuits_id_seq'::regclass);


--
-- Name: email_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs ALTER COLUMN id SET DEFAULT nextval('public.email_logs_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: races id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races ALTER COLUMN id SET DEFAULT nextval('public.races_id_seq'::regclass);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('public.refresh_tokens_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens ALTER COLUMN id SET DEFAULT nextval('public.verification_tokens_id_seq'::regclass);


--
-- Data for Name: bookings; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (1, 'APEX-1C44B0E8', 1, 11, 1, 1559.94, 'CANCELLED', NULL, '2026-06-19 08:39:11.881935', '2026-06-19 09:09:11.881935', NULL, '2026-06-19 09:10:00.073463', NULL, 'Auto-cancelled: booking expired after 30 minutes', 'VIP', 'admin@apexgrid.com', 'System Administrator', 'admin');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (2, 'APEX-B5350278', 1, 11, 1, 1559.94, 'CANCELLED', NULL, '2026-06-19 09:24:04.524355', '2026-06-19 09:54:04.524355', NULL, '2026-06-19 09:35:30.287896', NULL, 'Cancelled by user', 'VIP', 'admin@apexgrid.com', 'System Administrator', 'admin');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (3, 'APEX-63267FB9', 1, 20, 1, 2399.94, 'CANCELLED', NULL, '2026-06-19 09:36:19.595407', '2026-06-19 10:06:19.595407', NULL, '2026-06-19 09:37:09.058196', NULL, 'Cancelled by user', 'VIP', 'admin@apexgrid.com', 'System Administrator', 'admin');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (4, 'APEX-74DACA9B', 1, 11, 1, 259.99, 'CANCELLED', NULL, '2026-06-19 13:01:13.149239', '2026-06-19 13:31:13.149239', NULL, '2026-06-19 13:11:01.350951', NULL, 'Cancelled by user', 'GA', 'admin@apexgrid.com', 'System Administrator', 'admin');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (5, 'APEX-40CF574A', 1, 12, 1, 399.99, 'CANCELLED', NULL, '2026-06-19 13:11:14.108275', '2026-06-19 13:41:14.108275', NULL, '2026-06-19 13:12:28.338451', NULL, 'Cancelled by user', 'GA', 'admin@apexgrid.com', 'System Administrator', 'admin');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (6, 'APEX-D8E57F40', 1, 19, 1, 2999.94, 'CONFIRMED', NULL, '2026-06-19 13:17:45.116086', '2026-06-19 13:47:45.116086', '2026-06-19 13:30:18.219376', NULL, NULL, NULL, 'VIP', 'admin@apexgrid.com', 'System Administrator', 'admin');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (7, 'APEX-8BBA40AF', 4, 25, 1, 2699.94, 'CONFIRMED', NULL, '2026-06-19 13:47:20.37164', '2026-06-19 14:17:20.37164', '2026-06-19 13:47:30.016261', NULL, NULL, NULL, 'VIP', 'ratutuanratu@gmail.com', 'muhamad altariz', 'altariz');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (8, 'APEX-1E345900', 8, 11, 2, 519.98, 'CANCELLED', NULL, '2026-06-20 08:45:09.957312', '2026-06-20 09:15:09.957312', '2026-06-20 08:45:11.382489', '2026-06-20 08:45:12.650159', NULL, 'Cancelled by user', 'GA', 'testuser_1781945105905@example.com', 'QA Tester', 'testuser_1781945105905');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (9, 'APEX-8F5307D2', 8, 11, 1, 1559.94, 'CONFIRMED', NULL, '2026-06-20 08:45:12.825492', '2026-06-20 09:15:12.825492', '2026-06-20 08:45:12.982112', NULL, NULL, NULL, 'VIP', 'testuser_1781945105905@example.com', 'QA Tester', 'testuser_1781945105905');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (10, 'APEX-750BD6AA', 1, 11, 1, 259.99, 'USED', NULL, '2026-06-20 09:18:58.255194', '2026-06-20 09:48:58.255194', '2026-06-20 09:18:59.623853', NULL, '2026-06-20 09:19:00.791714', NULL, 'GA', 'admin@apexgrid.com', 'System Administrator', 'admin');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (11, 'APEX-9BFBD844', 9, 11, 2, 519.98, 'CANCELLED', NULL, '2026-06-20 10:01:01.037948', '2026-06-20 10:31:01.037948', '2026-06-20 10:01:01.836543', '2026-06-20 10:01:02.485205', NULL, 'Cancelled by user', 'GA', 'testuser_1781949644049@example.com', 'QA Tester', 'testuser_1781949644049');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (12, 'APEX-C277EFAC', 9, 11, 1, 1559.94, 'USED', NULL, '2026-06-20 10:01:02.662827', '2026-06-20 10:31:02.662827', '2026-06-20 10:01:02.770478', NULL, '2026-06-20 10:01:02.943441', NULL, 'VIP', 'testuser_1781949644049@example.com', 'QA Tester', 'testuser_1781949644049');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (13, 'APEX-13CBA552', 10, 11, 2, 519.98, 'CANCELLED', NULL, '2026-06-21 10:57:29.243985', '2026-06-21 11:27:29.243985', '2026-06-21 10:57:59.843977', '2026-06-21 10:58:49.280716', NULL, 'Cancelled by user', 'GA', 'testuser@apexgrid.com', 'Test User', 'testuser');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (14, 'APEX-97AFE9DC', 13, 11, 1, 259.99, 'CANCELLED', NULL, '2026-06-21 12:23:47.915313', '2026-06-21 12:53:47.915313', NULL, '2026-06-21 12:24:36.330391', NULL, 'Cancelled by user', 'GA', 'syakirmusaffa@gmail.com', 'Syakir', 'syakirmusaffa');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (15, 'APEX-7D597B1B', 13, 11, 10, 2599.90, 'CANCELLED', NULL, '2026-06-21 12:25:42.111958', '2026-06-21 12:55:42.111958', NULL, '2026-06-21 12:26:53.506307', NULL, 'Cancelled by user', 'GA', 'syakirmusaffa@gmail.com', 'Syakir', 'syakirmusaffa');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (16, 'APEX-3BFD0038', 13, 26, 1, 50.00, 'CANCELLED', NULL, '2026-06-21 12:28:50.373298', '2026-06-21 12:58:50.373298', NULL, '2026-06-21 12:29:55.981443', NULL, 'Cancelled by user', 'GA', 'syakirmusaffa@gmail.com', 'Syakir', 'syakirmusaffa');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (17, 'APEX-6D0D6715', 13, 11, 1, 259.99, 'CANCELLED', NULL, '2026-06-21 12:30:36.696292', '2026-06-21 13:00:36.696292', NULL, '2026-06-21 12:31:56.198231', NULL, 'Cancelled by user', 'GA', 'syakirmusaffa@gmail.com', 'Syakir', 'syakirmusaffa');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (18, 'APEX-B3CC60D4', 13, 11, 1, 259.99, 'CANCELLED', NULL, '2026-06-21 12:55:54.689486', '2026-06-21 13:25:54.689486', NULL, '2026-06-21 13:29:59.985157', NULL, 'Auto-cancelled: booking expired after 30 minutes', 'GA', 'syakirmusaffa@gmail.com', 'Syakir Musaffa', 'syakirmusaffa');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (19, 'APEX-C7334CB2', 1, 13, 1, 1439.94, 'CONFIRMED', NULL, '2026-06-22 01:31:41.388328', '2026-06-22 02:01:41.388328', '2026-06-22 01:31:59.151202', NULL, NULL, NULL, 'VIP', 'admin@apexgrid.com', 'System Administrator Tested', 'admin');
INSERT INTO public.bookings (id, booking_code, user_id, race_id, quantity, total_price, status, ticket_pdf_url, created_at, expired_at, confirmed_at, cancelled_at, scanned_at, cancellation_reason, zone, user_email, user_full_name, username) VALUES (20, 'APEX-A04D025B', 1, 11, 1, 1559.94, 'CANCELLED', NULL, '2026-06-22 01:32:19.29139', '2026-06-22 02:02:19.29139', NULL, '2026-06-22 01:32:29.94986', NULL, 'Cancelled by user', 'VIP', 'admin@apexgrid.com', 'System Administrator Tested', 'admin');


--
-- Data for Name: circuits; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (3, 'Suzuka International Racing Course', 'Suzuka', 'Japan', 5.807, 53, '1:30.983', 'Lewis Hamilton', NULL, 'Unique figure-of-eight layout with challenging corner sequences', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (4, 'Bahrain International Circuit', 'Sakhir', 'Bahrain', 5.412, 57, '1:30.252', 'Michael Schumacher', NULL, 'Spectacular desert night race with long straights and heavy braking zones', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (5, 'Jeddah Corniche Circuit', 'Jeddah', 'Saudi Arabia', 6.174, 50, '1:30.734', 'Lewis Hamilton', NULL, 'The fastest street circuit in Formula 1 history', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (6, 'Miami International Autodrome', 'Miami', 'USA', 5.412, 57, '1:29.708', 'Max Verstappen', NULL, 'Constructed around the Hard Rock Stadium complex in Miami Gardens', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (7, 'Autodromo Enzo e Dino Ferrari', 'Imola', 'Italy', 4.909, 63, '1:15.484', 'Lewis Hamilton', NULL, 'Classic, fast parkland circuit filled with rich F1 history', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (8, 'Circuit de Monaco', 'Monte Carlo', 'Monaco', 3.337, 78, '1:12.909', 'Lewis Hamilton', NULL, 'The jewel in the crown of Formula 1, tight and narrow street circuit', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (9, 'Circuit de Barcelona-Catalunya', 'Barcelona', 'Spain', 4.657, 66, '1:16.330', 'Max Verstappen', NULL, 'All-rounder circuit with high-speed corners and a long main straight', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (10, 'Circuit Gilles Villeneuve', 'Montreal', 'Canada', 4.361, 70, '1:13.078', 'Valtteri Bottas', NULL, 'Located on Notre Dame Island, famous for the Wall of Champions', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (11, 'Red Bull Ring', 'Spielberg', 'Austria', 4.318, 71, '1:05.619', 'Carlos Sainz', NULL, 'Short, fast, high-altitude track nestled in the Styrian hills', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (12, 'Silverstone Circuit', 'Silverstone', 'United Kingdom', 5.891, 52, '1:27.097', 'Max Verstappen', NULL, 'Historical home of British motorsport, famous for high-speed corners', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (13, 'Hungaroring', 'Budapest', 'Hungary', 4.381, 70, '1:16.627', 'Lewis Hamilton', NULL, 'Twisty, dusty track with high downforce demands, often called Monaco without walls', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (14, 'Circuit de Spa-Francorchamps', 'Spa-Francorchamps', 'Belgium', 7.004, 44, '1:40.510', 'Oscar Piastri', NULL, 'Breathtaking track in the Ardennes forest featuring the legendary Eau Rouge', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (15, 'Circuit Zandvoort', 'Zandvoort', 'Netherlands', 4.259, 72, '1:11.097', 'Lewis Hamilton', NULL, 'Undulating circuit with steep banking curves by the North Sea dunes', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (16, 'Autodromo Nazionale Monza', 'Monza', 'Italy', 5.793, 53, '1:21.046', 'Rubens Barrichello', NULL, 'The Temple of Speed, fastest track on the F1 calendar', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (17, 'Madrid Street Circuit', 'Madrid', 'Spain', 5.474, 55, 'N/A', 'N/A', NULL, 'New semi-street circuit in Madrid making its debut on the F1 calendar', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (18, 'Baku City Circuit', 'Baku', 'Azerbaijan', 6.003, 51, '1:43.009', 'Charles Leclerc', NULL, 'Combines tight historic Old City sections with a massive 2.2km main straight', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (19, 'Marina Bay Street Circuit', 'Singapore', 'Singapore', 4.940, 62, '1:35.867', 'Kevin Magnussen', NULL, 'Physically demanding night street race in the heart of Singapore', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (20, 'Circuit of The Americas', 'Austin', 'USA', 5.513, 56, '1:36.169', 'Charles Leclerc', NULL, 'Modern classic facility with design inspired by famous corners worldwide', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (21, 'Autodromo Hermanos Rodriguez', 'Mexico City', 'Mexico', 4.304, 71, '1:17.774', 'Valtteri Bottas', NULL, 'Highest-altitude track on the calendar, featuring the vibrant stadium section', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (22, 'Autodromo Jose Carlos Pace', 'Sao Paulo', 'Brazil', 4.309, 71, '1:10.540', 'Valtteri Bottas', NULL, 'Undulating, anti-clockwise circuit with passionate carnival atmosphere', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (23, 'Las Vegas Strip Circuit', 'Las Vegas', 'USA', 6.201, 50, '1:35.490', 'Oscar Piastri', NULL, 'High-speed street track racing past iconic Las Vegas casinos and landmarks', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (24, 'Lusail International Circuit', 'Lusail', 'Qatar', 5.419, 57, '1:24.319', 'Max Verstappen', NULL, 'Fast, flowing track with medium-to-high speed corners under floodlights', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (25, 'Yas Marina Circuit', 'Yas Island', 'Abu Dhabi', 5.281, 58, '1:25.637', 'Kevin magnussen', '', 'State-of-the-art twilight race to close out the Formula 1 season', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (1, 'Albert Park Circuit', 'Melbourne', 'Australia', 5.278, 58, '1:19.813', 'Charles Leclerc', '', 'Street circuit around Albert Park Lake (Tested)', '2026-06-18 07:43:16.887483');
INSERT INTO public.circuits (id, name, location, country, length_km, number_of_laps, lap_record, lap_record_holder, image_url, description, created_at) VALUES (2, 'Shanghai International Circuit', 'Shanghai', 'China', 5.451, 56, '1:32.238', 'Michael schumacher', '', 'Features a demanding layout shaped like the Chinese character "Shang"', '2026-06-18 07:43:16.887483');


--
-- Data for Name: email_logs; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (1, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-1C44B0E8', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-1C44B0E8</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$1559.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 1, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 08:39:14.824261');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (2, 'admin@apexgrid.com', '❌ Booking Cancelled — APEX-1C44B0E8', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-1C44B0E8</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Auto-cancelled: booking expired after 30 minutes</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 1, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 09:10:05.575497');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (3, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-B5350278', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-B5350278</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$1559.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 2, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 09:24:08.41347');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (4, 'admin@apexgrid.com', '❌ Booking Cancelled — APEX-B5350278', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-B5350278</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 2, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 09:35:34.335472');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (5, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-63267FB9', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-63267FB9</strong></td></tr>
        <tr><td>Race</td><td>United States Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Circuit of The Americas</td></tr>
        <tr><td>Race Date</td><td>25 October 2026, 14:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$2399.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 3, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 09:36:21.124878');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (6, 'admin@apexgrid.com', '❌ Booking Cancelled — APEX-63267FB9', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-63267FB9</strong> for <strong>United States Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 3, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 09:37:10.723458');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (7, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-74DACA9B', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-74DACA9B</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$259.990 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 4, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 13:01:16.004754');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (8, 'admin@apexgrid.com', '❌ Booking Cancelled — APEX-74DACA9B', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-74DACA9B</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 4, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 13:11:06.755131');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (9, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-40CF574A', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-40CF574A</strong></td></tr>
        <tr><td>Race</td><td>British Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Silverstone Circuit</td></tr>
        <tr><td>Race Date</td><td>05 July 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$399.990 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 5, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 13:11:16.547401');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (10, 'admin@apexgrid.com', '❌ Booking Cancelled — APEX-40CF574A', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-40CF574A</strong> for <strong>British Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 5, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 13:12:31.582399');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (11, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-D8E57F40', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-D8E57F40</strong></td></tr>
        <tr><td>Race</td><td>Singapore Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Marina Bay Street Circuit</td></tr>
        <tr><td>Race Date</td><td>11 October 2026, 20:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$2999.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 6, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 13:17:47.511966');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (12, 'ratutuanratu@gmail.com', '🏎️ Booking Confirmed — APEX-8BBA40AF', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-8BBA40AF</strong></td></tr>
        <tr><td>Race</td><td>Abu Dhabi Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Yas Marina Circuit</td></tr>
        <tr><td>Race Date</td><td>06 December 2026, 17:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$2699.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 7, 'FAILED', 0, NULL, 'Authentication failed', '2026-06-19 13:47:23.901179');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (13, 'testuser_1781945105905@example.com', '🏎️ Booking Confirmed — APEX-1E345900', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-1E345900</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>2</td></tr>
        <tr><td>Total Price</td><td><strong>$519.980 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 8, 'SENT', 0, NULL, NULL, '2026-06-20 08:45:28.138274');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (14, 'testuser_1781945105905@example.com', '❌ Booking Cancelled — APEX-1E345900', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-1E345900</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 8, 'SENT', 0, NULL, NULL, '2026-06-20 08:45:28.375626');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (15, 'testuser_1781945105905@example.com', '🏎️ Booking Confirmed — APEX-8F5307D2', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-8F5307D2</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$1559.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 9, 'SENT', 0, NULL, NULL, '2026-06-20 08:45:32.172612');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (16, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-750BD6AA', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-750BD6AA</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$259.990 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 10, 'SENT', 0, NULL, NULL, '2026-06-20 09:19:08.196529');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (17, 'testuser_1781949644049@example.com', '❌ Booking Cancelled — APEX-9BFBD844', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-9BFBD844</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 11, 'SENT', 0, NULL, NULL, '2026-06-20 10:01:06.886284');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (18, 'testuser_1781949644049@example.com', '🏎️ Booking Confirmed — APEX-9BFBD844', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-9BFBD844</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>2</td></tr>
        <tr><td>Total Price</td><td><strong>$519.980 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 11, 'SENT', 0, NULL, NULL, '2026-06-20 10:01:07.055688');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (19, 'testuser_1781949644049@example.com', '🏎️ Booking Confirmed — APEX-C277EFAC', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-C277EFAC</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$1559.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 12, 'SENT', 0, NULL, NULL, '2026-06-20 10:01:10.426058');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (20, 'testuser@apexgrid.com', '🏎️ Booking Confirmed — APEX-13CBA552', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-13CBA552</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>2</td></tr>
        <tr><td>Total Price</td><td><strong>$519.980 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 13, 'SENT', 0, NULL, NULL, '2026-06-21 10:57:36.86453');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (21, 'testuser@apexgrid.com', '❌ Booking Cancelled — APEX-13CBA552', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-13CBA552</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 13, 'SENT', 0, NULL, NULL, '2026-06-21 10:58:53.895709');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (22, 'syakirmusaffa@gmail.com', '🏎️ Booking Confirmed — APEX-97AFE9DC', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-97AFE9DC</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$259.990 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 14, 'SENT', 0, NULL, NULL, '2026-06-21 12:23:54.653181');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (23, 'syakirmusaffa@gmail.com', '❌ Booking Cancelled — APEX-97AFE9DC', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-97AFE9DC</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 14, 'SENT', 0, NULL, NULL, '2026-06-21 12:24:41.20631');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (24, 'syakirmusaffa@gmail.com', '🏎️ Booking Confirmed — APEX-7D597B1B', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-7D597B1B</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>10</td></tr>
        <tr><td>Total Price</td><td><strong>$2599.900 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 15, 'SENT', 0, NULL, NULL, '2026-06-21 12:25:46.661731');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (25, 'syakirmusaffa@gmail.com', '❌ Booking Cancelled — APEX-7D597B1B', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-7D597B1B</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 15, 'SENT', 0, NULL, NULL, '2026-06-21 12:26:57.882392');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (26, 'syakirmusaffa@gmail.com', '🏎️ Booking Confirmed — APEX-3BFD0038', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-3BFD0038</strong></td></tr>
        <tr><td>Race</td><td>Admin Test Race</td></tr>
        <tr><td>Circuit</td><td>Albert Park Circuit</td></tr>
        <tr><td>Race Date</td><td>10 October 2026, 10:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$50.000 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 16, 'SENT', 0, NULL, NULL, '2026-06-21 12:28:54.61912');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (27, 'syakirmusaffa@gmail.com', '❌ Booking Cancelled — APEX-3BFD0038', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-3BFD0038</strong> for <strong>Admin Test Race</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 16, 'SENT', 0, NULL, NULL, '2026-06-21 12:30:02.09585');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (28, 'syakirmusaffa@gmail.com', '🏎️ Booking Confirmed — APEX-6D0D6715', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-6D0D6715</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$259.990 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 17, 'SENT', 0, NULL, NULL, '2026-06-21 12:30:41.75123');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (29, 'syakirmusaffa@gmail.com', '❌ Booking Cancelled — APEX-6D0D6715', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-6D0D6715</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 17, 'SENT', 0, NULL, NULL, '2026-06-21 12:32:01.45517');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (30, 'syakirmusaffa@gmail.com', '🏎️ Booking Confirmed — APEX-B3CC60D4', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-B3CC60D4</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$259.990 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 18, 'SENT', 0, NULL, NULL, '2026-06-21 12:55:59.289435');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (31, 'syakirmusaffa@gmail.com', '❌ Booking Cancelled — APEX-B3CC60D4', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-B3CC60D4</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Auto-cancelled: booking expired after 30 minutes</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 18, 'SENT', 0, NULL, NULL, '2026-06-21 13:30:05.34001');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (32, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-C7334CB2', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-C7334CB2</strong></td></tr>
        <tr><td>Race</td><td>Hungarian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Hungaroring</td></tr>
        <tr><td>Race Date</td><td>26 July 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$1439.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 19, 'SENT', 0, NULL, NULL, '2026-06-22 01:31:45.805175');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (33, 'admin@apexgrid.com', '🏎️ Booking Confirmed — APEX-A04D025B', '<!DOCTYPE html>
<html>
<head><style>
  body { font-family: Arial, sans-serif; background: #15151E; color: #fff; }
  .container { max-width: 600px; margin: 20px auto; background: #1e1e2e; border-radius: 12px; overflow: hidden; }
  .header { background: #E10600; padding: 30px; text-align: center; }
  .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; }
  .content { padding: 30px; }
  .badge { display: inline-block; background: #E10600; color: white; padding: 6px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
  .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .info-table td { padding: 10px; border-bottom: 1px solid #2d2d3e; }
  .info-table td:first-child { color: #aaa; width: 40%; }
  .footer { background: #0f0f17; padding: 20px; text-align: center; color: #666; font-size: 12px; }
</style></head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏎️ APEXGRID</h1>
      <p style="margin:0;opacity:0.9">Formula 1 Race Tickets</p>
    </div>
    <div class="content">
      <h2>Your Booking is Confirmed!</h2>
      <div class="badge">PENDING CONFIRMATION</div>
      <table class="info-table">
        <tr><td>Booking Code</td><td><strong>APEX-A04D025B</strong></td></tr>
        <tr><td>Race</td><td>Austrian Grand Prix 2026</td></tr>
        <tr><td>Circuit</td><td>Red Bull Ring</td></tr>
        <tr><td>Race Date</td><td>28 June 2026, 15:00</td></tr>
        <tr><td>Tickets</td><td>1</td></tr>
        <tr><td>Total Price</td><td><strong>$1559.940 USD</strong></td></tr>
        <tr><td>Status</td><td>PENDING (expires in 30 minutes)</td></tr>
      </table>
      <p style="color:#aaa;font-size:14px;">Please confirm your booking within 30 minutes to secure your tickets.</p>
    </div>
    <div class="footer">
      <p>© 2026 ApexGrid — The Ultimate F1 Experience</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CONFIRMATION', 20, 'SENT', 0, NULL, NULL, '2026-06-22 01:32:22.562981');
INSERT INTO public.email_logs (id, recipient_email, subject, body, email_type, booking_id, status, retry_count, sent_at, error_message, created_at) VALUES (34, 'admin@apexgrid.com', '❌ Booking Cancelled — APEX-A04D025B', '<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;background:#15151E;color:#fff;">
  <div style="max-width:600px;margin:20px auto;background:#1e1e2e;border-radius:12px;overflow:hidden;">
    <div style="background:#333;padding:30px;text-align:center;">
      <h1 style="margin:0;color:#E10600;">🏎️ APEXGRID</h1>
    </div>
    <div style="padding:30px;">
      <h2>Booking Cancelled</h2>
      <p>Your booking <strong>APEX-A04D025B</strong> for <strong>Austrian Grand Prix 2026</strong> has been cancelled.</p>
      <p style="color:#aaa;">Reason: Cancelled by user</p>
      <p style="color:#aaa;">The quota has been restored and is available for other fans.</p>
    </div>
  </div>
</body>
</html>
', 'BOOKING_CANCELLATION', 20, 'SENT', 0, NULL, NULL, '2026-06-22 01:32:33.089405');


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.password_reset_tokens (id, user_id, token, expired_at, used, created_at) VALUES (1, 13, '1f35be67-f058-4a38-bea1-98559e006302', '2026-06-21 14:09:18.166955', true, '2026-06-21 13:09:18.173576');


--
-- Data for Name: races; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (14, 'Belgian Grand Prix 2026', 14, '2026-07-19 15:00:00', '15:00:00', 2026, 14, 6000, 6000, 349.99, 'USD', 'The Ardennes classic at Spa-Francorchamps', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (15, 'Dutch Grand Prix 2026', 15, '2026-08-30 15:00:00', '15:00:00', 2026, 15, 5000, 5000, 289.99, 'USD', 'Oranje army home race at Zandvoort', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (16, 'Italian Grand Prix 2026', 16, '2026-09-06 15:00:00', '15:00:00', 2026, 16, 5000, 5000, 319.99, 'USD', 'Tifosi celebration at Monza', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (17, 'Madrid Grand Prix 2026', 17, '2026-09-13 15:00:00', '15:00:00', 2026, 17, 4500, 4500, 399.99, 'USD', 'Debut of the Madrid Street Circuit', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (18, 'Azerbaijan Grand Prix 2026', 18, '2026-09-27 15:00:00', '15:00:00', 2026, 18, 4000, 4000, 299.99, 'USD', 'Street race chaos in Baku', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (20, 'United States Grand Prix 2026', 20, '2026-10-25 14:00:00', '14:00:00', 2026, 20, 6000, 6000, 399.99, 'USD', 'American spectacle in Austin', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (21, 'Mexico City Grand Prix 2026', 21, '2026-11-01 14:00:00', '14:00:00', 2026, 21, 5000, 5000, 249.99, 'USD', 'Fiesta in the high altitude of Mexico City', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (22, 'Brazilian Grand Prix 2026', 22, '2026-11-15 14:00:00', '14:00:00', 2026, 22, 5500, 5500, 199.99, 'USD', 'Title battle at Interlagos', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (23, 'Las Vegas Grand Prix 2026', 23, '2026-11-21 22:00:00', '22:00:00', 2026, 23, 4000, 4000, 599.99, 'USD', 'High stakes night race along the Strip', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (24, 'Qatar Grand Prix 2026', 24, '2026-11-29 20:00:00', '20:00:00', 2026, 24, 4500, 4500, 349.99, 'USD', 'Flowing speed at Lusail International Circuit', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 07:43:16.90548');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (1, 'Australian Grand Prix 2026', 1, '2026-03-08 15:00:00', '15:00:00', 2026, 1, 5000, 5000, 199.99, 'USD', 'Season opener at Albert Park', 'COMPLETED', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 21:59:59.872536');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (2, 'Chinese Grand Prix 2026', 2, '2026-03-15 15:00:00', '15:00:00', 2026, 2, 6000, 6000, 149.99, 'USD', 'Sprint weekend in Shanghai', 'COMPLETED', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 21:59:59.872536');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (3, 'Japanese Grand Prix 2026', 3, '2026-03-29 14:00:00', '14:00:00', 2026, 3, 5500, 5500, 249.99, 'USD', 'Race at the iconic Suzuka circuit', 'COMPLETED', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 21:59:59.872536');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (4, 'Bahrain Grand Prix 2026', 4, '2026-04-12 18:00:00', '18:00:00', 2026, 4, 4500, 4500, 299.99, 'USD', 'Night race under the desert lights', 'COMPLETED', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 21:59:59.872536');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (6, 'Miami Grand Prix 2026', 6, '2026-05-03 16:00:00', '16:00:00', 2026, 6, 5000, 5000, 499.99, 'USD', 'Sprint weekend in Miami Gardens', 'COMPLETED', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 21:59:59.872536');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (7, 'Emilia Romagna Grand Prix 2026', 7, '2026-05-17 15:00:00', '15:00:00', 2026, 7, 4000, 4000, 279.99, 'USD', 'Returning to the historic Imola circuit', 'COMPLETED', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 21:59:59.872536');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (8, 'Monaco Grand Prix 2026', 8, '2026-06-07 15:00:00', '15:00:00', 2026, 8, 3000, 3000, 699.99, 'USD', 'The legendary Monaco street race', 'COMPLETED', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 21:59:59.872536');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (9, 'Spanish Grand Prix 2026', 9, '2026-06-14 15:00:00', '15:00:00', 2026, 9, 6500, 6500, 299.99, 'USD', 'Battle at Barcelona-Catalunya', 'COMPLETED', NULL, '2026-06-18 07:43:16.90548', '2026-06-18 21:59:59.872536');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (19, 'Singapore Grand Prix 2026', 19, '2026-10-11 20:00:00', '20:00:00', 2026, 19, 3500, 3499, 499.99, 'USD', 'F1 original night street race', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-19 13:30:18.194694');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (10, 'Canadian Grand Prix 2026', 10, '2026-05-24 07:00:00', '14:00:00', 2026, 10, 5000, 5000, 329.99, 'USD', 'Action-packed race in Montreal', 'COMPLETED', '', '2026-06-18 07:43:16.90548', '2026-06-19 13:31:32.955497');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (25, 'Abu Dhabi Grand Prix 2026', 25, '2026-12-06 17:00:00', '17:00:00', 2026, 25, 5000, 4999, 449.99, 'USD', 'Sunset season finale at Yas Marina', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-19 13:47:30.011388');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (26, 'Admin Test Race', 1, '2026-10-10 10:00:00', NULL, 2026, NULL, 100, 100, 50.00, 'USD', NULL, 'UPCOMING', NULL, '2026-06-20 08:45:12.527843', '2026-06-20 08:45:12.527864');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (27, 'Admin Test Race', 1, '2026-10-10 10:00:00', NULL, 2026, NULL, 100, 100, 50.00, 'USD', NULL, 'UPCOMING', NULL, '2026-06-20 10:01:02.360807', '2026-06-20 10:01:02.36085');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (12, 'British Grand Prix 2026', 12, '2026-07-05 08:00:00', '15:00:00', 2026, 12, 8000, 8000, 399.99, 'USD', 'Home race for British drivers at Silverstone (Tested)', 'UPCOMING', '', '2026-06-18 07:43:16.90548', '2026-06-21 10:34:11.456417');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (11, 'Austrian Grand Prix 2026', 11, '2026-06-28 15:00:00', '15:00:00', 2026, 11, 6000, 5997, 259.99, 'USD', 'Home race for Red Bull Racing', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-21 10:58:49.239903');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (13, 'Hungarian Grand Prix 2026', 13, '2026-07-26 15:00:00', '15:00:00', 2026, 13, 5000, 4999, 239.99, 'USD', 'High downforce race at Hungaroring', 'UPCOMING', NULL, '2026-06-18 07:43:16.90548', '2026-06-22 01:31:59.127229');
INSERT INTO public.races (id, name, circuit_id, race_date, race_time, season, round, total_quota, available_quota, ticket_price, currency, description, status, image_url, created_at, updated_at) VALUES (5, 'Saudi Arabian Grand Prix 2026', 5, '2026-04-19 13:00:00', '20:00:00', 2026, 5, 3000, 3000, 349.99, 'USD', 'High-speed street fight in Jeddah', 'COMPLETED', '', '2026-06-18 07:43:16.90548', '2026-06-22 01:33:20.15007');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.refresh_tokens (id, user_id, token, expiry_date, created_at) VALUES (3, 4, '14eeb63e-2111-4d72-8a67-4c3d6c4c30dd', '2026-06-26 13:46:31.765327', '2026-06-19 13:46:31.491227');
INSERT INTO public.refresh_tokens (id, user_id, token, expiry_date, created_at) VALUES (6, 6, '068228e9-3444-422c-8619-29adf06500bd', '2026-06-27 08:17:24.273781', '2026-06-20 08:17:23.954829');
INSERT INTO public.refresh_tokens (id, user_id, token, expiry_date, created_at) VALUES (9, 7, 'd9f95739-4a4f-4135-8590-ee9d5ff78a65', '2026-06-27 08:42:11.093382', '2026-06-20 08:42:10.744548');
INSERT INTO public.refresh_tokens (id, user_id, token, expiry_date, created_at) VALUES (12, 8, '7d8ba801-acce-4105-bf44-41b7e7905f26', '2026-06-27 08:45:09.381307', '2026-06-20 08:45:09.177079');
INSERT INTO public.refresh_tokens (id, user_id, token, expiry_date, created_at) VALUES (16, 9, '11519c83-ced2-4066-884f-df4147638075', '2026-06-27 10:00:57.957337', '2026-06-20 10:00:57.708511');
INSERT INTO public.refresh_tokens (id, user_id, token, expiry_date, created_at) VALUES (30, 13, 'b32b8991-03cb-431f-bdaf-5cf355733a61', '2026-06-28 13:58:37.407489', '2026-06-21 13:58:37.131617');
INSERT INTO public.refresh_tokens (id, user_id, token, expiry_date, created_at) VALUES (36, 1, 'd873cc98-4250-43d8-8736-d22b34cdbde3', '2026-06-29 02:10:30.023946', '2026-06-22 02:10:29.058879');


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.roles (id, name, created_at) VALUES (1, 'USER', '2026-06-18 07:43:16.26418');
INSERT INTO public.roles (id, name, created_at) VALUES (2, 'ADMIN', '2026-06-18 07:43:16.26418');


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (3, 'alif', 'pratamaalifrifky@gmail.com', '$2a$10$yzZKcIfI1LKePgz6SnFKBePsrkuoV8e4kf/dtVNArzc9gf4Bs3Tyy', 'alif', 1, true, false, '2026-06-19 13:34:35.614372', '2026-06-19 13:34:35.614398');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (5, 'testuser_1781943180765', 'testuser_1781943180765@example.com', '$2a$10$VFrMyix.guDJImuXaOo4vuT6/IerKv6Bb41E42UIsMFiwn3wWW20G', 'QA Tester', 1, true, true, '2026-06-20 08:13:08.349798', '2026-06-20 08:13:09.789298');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (6, 'testuser_1781943440344', 'testuser_1781943440344@example.com', '$2a$10$IdpMZTaVRuBT9cy4g/We6ewIygRalnJJMgEiAAZYzv/tRLFB5R8XK', 'QA Tester', 1, true, true, '2026-06-20 08:17:20.873066', '2026-06-20 08:17:21.578167');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (7, 'testuser_1781944926633', 'testuser_1781944926633@example.com', '$2a$10$JTOcO0RcG9xB/8rRgcRM0OedWdgAIEq7DcJAJAuiHcY3.PwBug0yu', 'QA Tester', 1, true, true, '2026-06-20 08:42:07.170758', '2026-06-20 08:42:07.870796');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (8, 'testuser_1781945105905', 'testuser_1781945105905@example.com', '$2a$10$KgpCpFp1n9bL7WZCHBYyl.kpdKqTknNfPCZyr5iGDKRnYzh6Q/WG6', 'QA Tester', 1, true, true, '2026-06-20 08:45:06.339745', '2026-06-20 08:45:07.597027');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (9, 'testuser_1781949644049', 'testuser_1781949644049@example.com', '$2a$10$Xn3eCnJ9rBpcSGE8mjIqoutlHw4PNrg53d4eUlcvhdIB/lW4rEYFe', 'QA Tester', 1, true, true, '2026-06-20 10:00:50.330054', '2026-06-20 10:00:53.156751');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (1, 'admin', 'admin@apexgrid.com', '$2a$10$yqph6nyPCiU.MjuujOqseOKjkae/cmBIjAzW4aMCb/Y8vfWOPH3wS', 'System Administrator Tested', 2, true, true, '2026-06-19 08:01:13.573726', '2026-06-21 10:48:42.902722');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (11, 'testuser2', 'testuser2@apexgrid.com', '$2a$10$lUe2gbXjFuhpDcE9trl2Tu9bRbxE6LuxVV7dD9qFTvShdkByuE5ve', 'Test User Two', 1, true, false, '2026-06-21 10:50:07.674446', '2026-06-21 10:50:07.674504');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (10, 'testuser', 'testuser@apexgrid.com', '$2a$10$Dr1goZwSUohF0CeZ.ut6WeA.jokFctu/h1U2YdMCN03LOVAk7RE4i', 'Test User', 1, true, true, '2026-06-21 10:42:43.404961', '2026-06-21 10:54:38.706833');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (12, 'ratutuanratu_test', 'ratutuanratu+test@gmail.com', '$2a$10$zC2.u8pBdo8E3Z4ynvsZfuiSFQS6gHJwIv7OPSbDuZ.YwIG1SXUfi', 'Ratu Test', 1, true, false, '2026-06-21 11:53:07.618585', '2026-06-21 11:53:07.618709');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (4, 'altariz', 'ratutuanratu@gmail.com', '$2a$10$77uNKLkqBhUptl4nKCx0C./KZp3l.oJd1EZpI8wNqjgMyagi0Rz8y', 'muhamad altariz', 1, true, true, '2026-06-19 13:45:29.00856', '2026-06-21 12:04:05.729426');
INSERT INTO public.users (id, username, email, password, full_name, role_id, is_active, is_verified, created_at, updated_at) VALUES (13, 'syakirmusaffa', 'syakirmusaffa@gmail.com', '$2a$10$bGZqQ4a/tM/st6aC7RDplOF69zvuSZnQJS708et89fMI77C8ao66m', 'Syakir Musaffa', 1, true, true, '2026-06-21 12:12:28.459131', '2026-06-21 13:58:27.721802');


--
-- Data for Name: verification_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.verification_tokens (id, user_id, token, expired_at, created_at) VALUES (3, 3, 'eb827c89-cea0-4a2e-94ee-3b83d281e5f7', '2026-06-20 13:39:15.5236', '2026-06-19 13:39:15.531296');
INSERT INTO public.verification_tokens (id, user_id, token, expired_at, created_at) VALUES (10, 11, '0a4805ca-79cd-4cfb-8a05-af62270d9248', '2026-06-22 10:50:07.689774', '2026-06-21 10:50:07.720191');
INSERT INTO public.verification_tokens (id, user_id, token, expired_at, created_at) VALUES (11, 12, '50bf7a43-1bf5-4c99-a1ec-c4598a71a2a1', '2026-06-22 11:53:08.104863', '2026-06-21 11:53:08.127013');


--
-- Name: bookings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bookings_id_seq', 20, true);


--
-- Name: circuits_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.circuits_id_seq', 25, true);


--
-- Name: email_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.email_logs_id_seq', 34, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 1, true);


--
-- Name: races_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.races_id_seq', 27, true);


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.refresh_tokens_id_seq', 36, true);


--
-- Name: roles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.roles_id_seq', 2, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.users_id_seq', 13, true);


--
-- Name: verification_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.verification_tokens_id_seq', 12, true);


--
-- Name: bookings bookings_booking_code_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_booking_code_key UNIQUE (booking_code);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: circuits circuits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.circuits
    ADD CONSTRAINT circuits_pkey PRIMARY KEY (id);


--
-- Name: email_logs email_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT email_logs_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: races races_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races
    ADD CONSTRAINT races_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: refresh_tokens refresh_tokens_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_key UNIQUE (user_id);


--
-- Name: roles roles_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_name_key UNIQUE (name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_username_key UNIQUE (username);


--
-- Name: verification_tokens verification_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_pkey PRIMARY KEY (id);


--
-- Name: verification_tokens verification_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT verification_tokens_token_key UNIQUE (token);


--
-- Name: idx_bookings_code; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_code ON public.bookings USING btree (booking_code);


--
-- Name: idx_bookings_expired; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_expired ON public.bookings USING btree (expired_at) WHERE ((status)::text = 'PENDING'::text);


--
-- Name: idx_bookings_race; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_race ON public.bookings USING btree (race_id);


--
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- Name: idx_bookings_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_user ON public.bookings USING btree (user_id);


--
-- Name: idx_email_logs_booking; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_booking ON public.email_logs USING btree (booking_id);


--
-- Name: idx_email_logs_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_email_logs_status ON public.email_logs USING btree (status);


--
-- Name: idx_races_circuit; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_races_circuit ON public.races USING btree (circuit_id);


--
-- Name: idx_races_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_races_date ON public.races USING btree (race_date);


--
-- Name: idx_races_season; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_races_season ON public.races USING btree (season);


--
-- Name: idx_races_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_races_status ON public.races USING btree (status);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role_id);


--
-- Name: idx_users_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_username ON public.users USING btree (username);


--
-- Name: bookings trg_set_expiry; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_set_expiry BEFORE INSERT ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.set_booking_expiry();


--
-- Name: bookings trg_update_quota; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trg_update_quota AFTER UPDATE ON public.bookings FOR EACH ROW WHEN (((old.status)::text IS DISTINCT FROM (new.status)::text)) EXECUTE FUNCTION public.update_race_quota();


--
-- Name: races update_races_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_races_updated_at BEFORE UPDATE ON public.races FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: bookings fk_bookings_race; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT fk_bookings_race FOREIGN KEY (race_id) REFERENCES public.races(id) ON DELETE RESTRICT;


--
-- Name: email_logs fk_email_logs_booking; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_logs
    ADD CONSTRAINT fk_email_logs_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- Name: races fk_races_circuit; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.races
    ADD CONSTRAINT fk_races_circuit FOREIGN KEY (circuit_id) REFERENCES public.circuits(id) ON DELETE RESTRICT;


--
-- Name: refresh_tokens fk_refresh_token_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT fk_refresh_token_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: password_reset_tokens fk_reset_token_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT fk_reset_token_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users fk_users_role; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT fk_users_role FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: verification_tokens fk_verif_token_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.verification_tokens
    ADD CONSTRAINT fk_verif_token_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict KPvE9ejhFwQZfguxaXKb3ZiA5bAIXQj5KQ1lwYdkkYccYe0tWZyCJxwxtISjbD0

